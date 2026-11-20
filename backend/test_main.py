import os
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.classifier import scam_probability
from backend.explanations import explain_with_llm
from backend.main import ScanRequest, analyze, app
from backend.models import ScanRecord, User


class ScanTests(unittest.TestCase):
    def test_suspicious_link_and_urgent_message_are_flagged(self):
        result = analyze(ScanRequest(
            scan_type="message",
            content="URGENT: Verify your identity immediately at http://secure-account-verify.example.com/login",
        ))
        self.assertGreaterEqual(result.risk_score, 40)
        self.assertEqual(result.verdict, "High risk")
        self.assertIn("unencrypted", {finding.code for finding in result.findings})
        self.assertIn("urgency", {finding.code for finding in result.findings})

    def test_job_offer_upfront_fee_is_flagged(self):
        result = analyze(ScanRequest(
            scan_type="job",
            content="Remote job, no experience needed. Pay a refundable $49 onboarding fee to secure your position.",
        ))
        self.assertEqual(result.verdict, "Suspicious")
        self.assertIn("payment", {finding.code for finding in result.findings})

    def test_https_url_without_other_signals_scores_low(self):
        result = analyze(ScanRequest(scan_type="website", content="https://example.org"))
        self.assertLess(result.risk_score, 40)
        self.assertEqual(result.risk_level, "low")

    def test_classifier_ranks_scam_like_text_above_routine_text(self):
        scam_score = scam_probability("urgent verify your password immediately or account suspended", "message")
        routine_score = scam_probability("your appointment is confirmed for next Tuesday", "message")
        self.assertGreater(scam_score, routine_score)


class AccountApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)

        def override_db():
            db = self.Session()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_db
        self.client_context = TestClient(app)
        self.client = self.client_context.__enter__()

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        app.dependency_overrides.clear()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def test_account_scan_history_and_authentication(self):
        registration = self.client.post(
            "/api/auth/register",
            json={"email": "Person@example.com", "password": "secure-password-123"},
        )
        self.assertEqual(registration.status_code, 201)
        token = registration.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        scan = self.client.post(
            "/api/scan",
            headers=headers,
            json={"scan_type": "message", "content": "URGENT verify your password immediately"},
        )
        self.assertEqual(scan.status_code, 200)
        self.assertTrue(scan.json()["saved_to_account"])
        self.assertEqual(scan.json()["model_version"], "starter-tfidf-v1")
        self.assertEqual(scan.json()["explanation_status"], "not_configured")

        history = self.client.get("/api/history", headers=headers)
        self.assertEqual(history.status_code, 200)
        self.assertEqual(len(history.json()), 1)
        self.assertIn("URGENT", history.json()[0]["content"])
        stats = self.client.get("/api/stats", headers=headers)
        self.assertEqual(stats.status_code, 200)
        self.assertEqual(stats.json()["total_scans"], 1)
        self.assertEqual(stats.json()["scans_today"], 1)
        self.assertEqual(stats.json()["flagged_scans"], 1)
        self.assertGreaterEqual(stats.json()["average_risk_score"], 40)
        self.assertEqual(self.client.get("/api/history").status_code, 401)
        self.assertEqual(self.client.get("/api/stats").status_code, 401)

    def test_duplicate_account_and_login(self):
        credentials = {"email": "person@example.com", "password": "secure-password-123"}
        self.assertEqual(self.client.post("/api/auth/register", json=credentials).status_code, 201)
        self.assertEqual(self.client.post("/api/auth/register", json=credentials).status_code, 409)
        login = self.client.post("/api/auth/login", json=credentials)
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["user"]["email"], "person@example.com")

        db = self.Session()
        user = db.scalar(select(User).where(User.email == "person@example.com"))
        self.assertNotEqual(user.password_hash, credentials["password"])
        db.close()

    def test_account_history_is_isolated_and_can_be_cleared(self):
        first = self.client.post(
            "/api/auth/register",
            json={"email": "first@example.org", "password": "secure-password-123"},
        ).json()
        second = self.client.post(
            "/api/auth/register",
            json={"email": "second@example.org", "password": "secure-password-123"},
        ).json()
        first_headers = {"Authorization": f"Bearer {first['access_token']}"}
        second_headers = {"Authorization": f"Bearer {second['access_token']}"}

        self.client.post(
            "/api/scan",
            headers=first_headers,
            json={"scan_type": "message", "content": "Your package is delayed"},
        )
        self.assertEqual(len(self.client.get("/api/history", headers=first_headers).json()), 1)
        self.assertEqual(self.client.get("/api/history", headers=second_headers).json(), [])
        self.assertEqual(self.client.delete("/api/history", headers=first_headers).status_code, 204)
        self.assertEqual(self.client.get("/api/history", headers=first_headers).json(), [])
        self.assertEqual(self.client.get("/api/stats", headers=first_headers).json()["total_scans"], 0)


class ExplanationTests(unittest.IsolatedAsyncioTestCase):
    async def test_provider_is_optional(self):
        with patch.dict(os.environ, {"LLM_API_KEY": ""}):
            explanation, provider_status = await explain_with_llm("text", [], "Low risk")
        self.assertIsNone(explanation)
        self.assertEqual(provider_status, "not_configured")

    async def test_configured_provider_returns_explanation(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {"choices": [{"message": {"content": "Check the sender before replying."}}]}

        class FakeClient:
            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                return None

            async def post(self, *_args, **_kwargs):
                return FakeResponse()

        with patch.dict(os.environ, {"LLM_API_KEY": "test-key"}), patch(
            "backend.explanations.httpx.AsyncClient", return_value=FakeClient()
        ):
            explanation, provider_status = await explain_with_llm("untrusted text", [], "Suspicious")
        self.assertEqual(explanation, "Check the sender before replying.")
        self.assertEqual(provider_status, "generated")


if __name__ == "__main__":
    unittest.main()
