from __future__ import annotations

import logging
import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field, field_validator
from pwdlib import PasswordHash
from sqlalchemy import case, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.classifier import MODEL_VERSION, scam_probability
from backend.database import Base, engine, get_db
from backend.explanations import explain_with_llm
from backend.models import ScanRecord, User, utc_now

app = FastAPI(title="ScamShield AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

_configured_jwt_secret = os.getenv("SCAMSHIELD_JWT_SECRET")
if os.getenv("APP_ENV", "development").lower() == "production" and not _configured_jwt_secret:
    raise RuntimeError("SCAMSHIELD_JWT_SECRET must be set in production.")
if not _configured_jwt_secret:
    logging.getLogger(__name__).warning(
        "SCAMSHIELD_JWT_SECRET is unset; using an ephemeral development key. Existing sessions will expire when the API restarts."
    )
_jwt_secret = _configured_jwt_secret or secrets.token_urlsafe(48)
_password_hash = PasswordHash.recommended()
_bearer = HTTPBearer(auto_error=False)
_TOKEN_TTL = timedelta(hours=12)


class ScanRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10_000)
    scan_type: str = Field(pattern="^(website|message|email|job)$")


class Finding(BaseModel):
    code: str
    description: str


class ScanResponse(BaseModel):
    scan_type: str
    risk_score: int
    risk_level: str
    verdict: str
    summary: str
    findings: list[Finding]
    recommendation: str
    disclaimer: str
    model_score: int
    model_version: str
    explanation: str | None
    explanation_status: str
    saved_to_account: bool = False


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("Enter a valid email address.")
        return normalized


class AccountResponse(BaseModel):
    id: int
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AccountResponse


class HistoryItem(BaseModel):
    id: int
    scan_type: str
    content: str
    risk_score: int
    verdict: str
    created_at: datetime


class ScanStats(BaseModel):
    total_scans: int
    scans_today: int
    flagged_scans: int
    average_risk_score: int


URL_PATTERN = re.compile(r"https?://[^\s<>\])}]+|www\.[^\s<>\])}]+", re.IGNORECASE)
URGENT_TERMS = ("urgent", "immediately", "act now", "suspended", "limited time", "expires today")
CREDENTIAL_TERMS = ("password", "verify your identity", "verification code", "one-time code", "sign in", "log in")
PAYMENT_TERMS = ("gift card", "wire transfer", "crypto", "cryptocurrency", "upfront fee", "processing fee", "onboarding fee", "pay a fee")
JOB_TERMS = ("work from home", "remote job", "no experience", "guaranteed income", "selected for", "job offer")


def _url_signals(value: str) -> list[Finding]:
    cleaned = value.rstrip(".,!?;:")
    parsed = urlparse(cleaned if "://" in cleaned else f"https://{cleaned}")
    host = (parsed.hostname or "").lower()
    findings: list[Finding] = []

    if cleaned.lower().startswith("http://"):
        findings.append(Finding(code="unencrypted", description="The link uses HTTP, so its connection is not encrypted."))
    if host and re.fullmatch(r"(?:\d{1,3}\.){3}\d{1,3}", host):
        findings.append(Finding(code="ip_address", description="The link uses a numeric IP address instead of a recognizable domain."))
    if "xn--" in host:
        findings.append(Finding(code="punycode", description="The domain contains encoded characters that can disguise its appearance."))
    if host.count(".") >= 4:
        findings.append(Finding(code="subdomains", description="The link has an unusually long chain of subdomains."))
    if "@" in parsed.netloc:
        findings.append(Finding(code="at_symbol", description="The link contains an @ symbol that can obscure its actual destination."))
    if len(cleaned) > 100:
        findings.append(Finding(code="long_url", description="The link is unusually long, which can make its destination harder to inspect."))
    if any(term in host for term in ("login", "verify", "secure", "account", "update", "wallet")) and host.count("-") >= 2:
        findings.append(Finding(code="brand_bait", description="The domain combines account or security terms with multiple hyphens; check the registered domain carefully."))
    return findings


def analyze(request: ScanRequest, model_score: int | None = None) -> ScanResponse:
    content = request.content.strip()
    lowered = content.lower()
    findings: list[Finding] = []
    seen: set[str] = set()

    def add(code: str, description: str) -> None:
        if code not in seen:
            findings.append(Finding(code=code, description=description))
            seen.add(code)

    urls = URL_PATTERN.findall(content)
    if request.scan_type == "website" and not urls:
        urls = [content]
    for raw_url in urls[:5]:
        for finding in _url_signals(raw_url):
            add(finding.code, finding.description)

    if any(term in lowered for term in URGENT_TERMS):
        add("urgency", "The message uses urgent language or a deadline to pressure a quick response.")
    if any(term in lowered for term in CREDENTIAL_TERMS):
        add("credentials", "It asks you to sign in or provide sensitive account information.")
    if any(term in lowered for term in PAYMENT_TERMS):
        add("payment", "It mentions an upfront payment or an unusual payment method.")
    if request.scan_type == "job" and any(term in lowered for term in JOB_TERMS):
        add("job_claim", "The offer uses common recruiting claims; verify the role on the employer's official careers site.")
    if request.scan_type in {"message", "email"} and any(term in lowered for term in ("click here", "open this link", "follow this link")):
        add("link_prompt", "It encourages you to open a link instead of independently visiting the official site.")

    points = {
        "unencrypted": 18,
        "ip_address": 28,
        "punycode": 32,
        "subdomains": 14,
        "at_symbol": 26,
        "long_url": 8,
        "brand_bait": 22,
        "urgency": 18,
        "credentials": 24,
        "payment": 28,
        "job_claim": 12,
        "link_prompt": 12,
    }
    heuristic_score = min(100, sum(points[finding.code] for finding in findings))
    probability_score = model_score if model_score is not None else round(scam_probability(content, request.scan_type) * 100)
    score = round(heuristic_score * 0.8 + probability_score * 0.2)

    if score >= 75:
        level, verdict = "high", "High risk"
        summary = "Several warning signs were found. Treat this as potentially harmful until you verify it independently."
        recommendation = "Do not click links, reply, share codes, or send money. Contact the organization through a website or number you find yourself."
    elif score >= 40:
        level, verdict = "medium", "Suspicious"
        summary = "Some warning signs were found. Take a moment to verify the sender and destination before responding."
        recommendation = "Avoid links and attachments for now. Check through the organization's official app or website."
    else:
        level, verdict = "low", "Low risk"
        summary = "Few common warning signs were detected. This screening cannot confirm that the content is genuine."
        recommendation = "Continue to check the sender and destination carefully; never share passwords or verification codes."

    return ScanResponse(
        scan_type=request.scan_type,
        risk_score=score,
        risk_level=level,
        verdict=verdict,
        summary=summary,
        findings=findings,
        recommendation=recommendation,
        disclaimer="This screening combines a small starter ML model and heuristics. It can make mistakes and is not a guarantee of safety.",
        model_score=probability_score,
        model_version=MODEL_VERSION,
        explanation=None,
        explanation_status="not_configured",
    )


def _create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user.id), "iat": now, "exp": now + _TOKEN_TTL},
        _jwt_secret,
        algorithm="HS256",
    )


def _current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your session expired. Sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, _jwt_secret, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        raise unauthorized from None
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


def _issue_token(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=_create_access_token(user),
        user=AccountResponse(id=user.id, email=user.email),
    )


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "classifier": MODEL_VERSION,
        "llm": "configured" if os.getenv("LLM_API_KEY") else "not_configured",
        "database": "postgresql" if os.getenv("DATABASE_URL", "").startswith(("postgresql://", "postgresql+")) else "sqlite",
    }


@app.post("/api/auth/register", response_model=TokenResponse, status_code=201)
def register(payload: Credentials, db: Session = Depends(get_db)) -> TokenResponse:
    user = User(email=payload.email, password_hash=_password_hash.hash(payload.password))
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
    return _issue_token(user)


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: Credentials, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not _password_hash.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return _issue_token(user)


@app.get("/api/auth/me", response_model=AccountResponse)
def account(user: User | None = Depends(_current_user)) -> AccountResponse:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to view your account.")
    return AccountResponse(id=user.id, email=user.email)


@app.get("/api/history", response_model=list[HistoryItem])
def history(user: User | None = Depends(_current_user), db: Session = Depends(get_db)) -> list[HistoryItem]:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to sync scan history.")
    scans = db.scalars(
        select(ScanRecord).where(ScanRecord.user_id == user.id).order_by(ScanRecord.created_at.desc()).limit(100)
    ).all()
    return [
        HistoryItem(
            id=scan.id,
            scan_type=scan.scan_type,
            content=scan.content,
            risk_score=scan.risk_score,
            verdict=scan.verdict,
            created_at=scan.created_at if scan.created_at.tzinfo else scan.created_at.replace(tzinfo=timezone.utc),
        )
        for scan in scans
    ]


@app.get("/api/stats", response_model=ScanStats)
def scan_stats(user: User | None = Depends(_current_user), db: Session = Depends(get_db)) -> ScanStats:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to view account scan statistics.")

    start_of_day = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    total_scans, scans_today, flagged_scans, average_risk_score = db.execute(
        select(
            func.count(ScanRecord.id),
            func.coalesce(func.sum(case((ScanRecord.created_at >= start_of_day, 1), else_=0)), 0),
            func.coalesce(func.sum(case((ScanRecord.risk_score >= 40, 1), else_=0)), 0),
            func.coalesce(func.avg(ScanRecord.risk_score), 0),
        ).where(ScanRecord.user_id == user.id)
    ).one()
    return ScanStats(
        total_scans=total_scans,
        scans_today=scans_today,
        flagged_scans=flagged_scans,
        average_risk_score=round(average_risk_score),
    )


@app.delete("/api/history", status_code=204)
def clear_history(user: User | None = Depends(_current_user), db: Session = Depends(get_db)) -> None:
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to clear account history.")
    db.query(ScanRecord).filter(ScanRecord.user_id == user.id).delete()
    db.commit()


@app.post("/api/scan", response_model=ScanResponse)
async def scan(
    request: ScanRequest,
    user: User | None = Depends(_current_user),
    db: Session = Depends(get_db),
) -> ScanResponse:
    content = request.content.strip()
    if not content:
        raise HTTPException(status_code=422, detail="Content cannot be blank.")

    model_score = round(scam_probability(content, request.scan_type) * 100)
    result = analyze(request, model_score)
    explanation, explanation_status = await explain_with_llm(
        content,
        [finding.model_dump() for finding in result.findings],
        result.verdict,
    )
    result.explanation = explanation
    result.explanation_status = explanation_status

    if user is not None:
        record = ScanRecord(
            user_id=user.id,
            content=content,
            scan_type=request.scan_type,
            risk_score=result.risk_score,
            verdict=result.verdict,
            created_at=utc_now(),
        )
        db.add(record)
        db.commit()
        result.saved_to_account = True
    return result
