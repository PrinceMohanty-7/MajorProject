# ScamShield AI

ScamShield AI is a full-stack scam-awareness application that helps users check suspicious websites, text messages, emails, and job offers. It combines deterministic warning-sign rules with a small TF-IDF and logistic-regression text classifier, then presents a risk score, warning indicators, evidence, recommendations, and an optional AI-generated explanation.

The project is designed for people who want a quick, understandable first check before clicking a link, replying to a message, sharing personal information, or paying a fee.

> ScamShield AI is a decision-support tool, not a guarantee of safety. It does not verify domain ownership, connect to domain blocklists, or replace trusted verification channels.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [How the Scan Works](#how-the-scan-works)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Frontend Features](#frontend-features)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Security and Privacy](#security-and-privacy)
- [Model and Limitations](#model-and-limitations)
- [Future Improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)

---

## Features

### Scam scanning

- Scan complete website URLs, text messages, email content, or job offers.
- Score content from 0 to 100.
- Group results into three levels:
  - Low risk: 0–39
  - Suspicious / medium risk: 40–74
  - High risk: 75–100
- Detect URL-related warning signs, including:
  - HTTP instead of HTTPS
  - Numeric IP addresses
  - Punycode domains
  - Long subdomain chains
  - `@` symbols in URLs
  - Long URLs
  - Account-security brand-bait patterns
- Detect urgency, credential requests, unusual payments, job claims, and link prompts.
- Highlight the submitted phrases that support detected findings.
- Provide recommended next steps.

### Account and history

- Use the scanner without creating an account.
- Keep anonymous scan history in browser `localStorage`.
- Register or sign in to store scan records in SQLite or PostgreSQL.
- View account-specific scan history and statistics.
- Clear account or local history.
- Merge matching local and server history after signing in.

### Dashboard

- View scans completed today.
- View the number of flagged scans.
- View average risk across saved scans.
- Inspect a risk distribution summary.
- Open detailed reports.
- Download or copy report text.
- Review recent scan activity.

### Awareness practice

- Complete fictional scam-awareness scenarios.
- Receive immediate explanations.
- Save best score and attempt count in browser storage.

### User experience

- Responsive React interface.
- Light and dark themes.
- Theme and authentication state stored in the browser.
- Loading, validation, offline, authentication, and empty states.
- Keyboard-accessible controls and reduced-motion support.
- Shared CSS design tokens for typography, spacing, radii, colors, and shadows.

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 | Component-based user interface |
| Vite 8 | Development server and production builds |
| JavaScript / JSX | Application logic and components |
| Tailwind CSS 4 | Vite integration and utility CSS foundation |
| Plain CSS | Project-specific design system and components |
| Oxlint | Frontend linting |
| Browser Local Storage | Anonymous history, theme, quiz, and JWT storage |
| Fetch API | Communication with the backend |

### Backend

| Technology | Purpose |
|---|---|
| Python | Backend programming language |
| FastAPI | REST API and request validation |
| Uvicorn | ASGI application server |
| Pydantic | API data schemas and validation |
| SQLAlchemy 2 | ORM and database access |
| SQLite | Default local database |
| PostgreSQL / Supabase-compatible databases | Optional production database |
| psycopg | PostgreSQL driver |
| PyJWT | JWT access-token creation and validation |
| pwdlib + Argon2 | Password hashing and verification |
| scikit-learn | TF-IDF vectorization and logistic regression |
| HTTPX | Optional OpenAI-compatible API requests |

### Testing

| Tool | Purpose |
|---|---|
| Python `unittest` | Backend unit and API tests |
| FastAPI `TestClient` | HTTP endpoint tests |
| SQLite StaticPool | Isolated test database |
| Mock/patch | Provider and external-service tests |
| Oxlint | Frontend code checks |
| Vite build | Frontend production build verification |

---

## System Architecture

```text
+---------------------------------------------------------------+
|                         Browser                               |
|                                                               |
|  React / Vite User Interface                                  |
|  -----------------------------------------------------------  |
|  Dashboard | Scanner | History | Awareness Quiz | Auth UI     |
|                                                               |
|  Local Storage                                                |
|  - scamshield-scans                                           |
|  - scamshield-token                                           |
|  - scamshield-theme                                           |
|  - scamshield-quiz-stats                                      |
+-------------------------------+-------------------------------+
                                |
                         HTTP / JSON
                                |
+-------------------------------v-------------------------------+
|                    Vite Development Proxy                      |
|                         /api -> :8000                         |
+-------------------------------+-------------------------------+
                                |
+-------------------------------v-------------------------------+
|                    FastAPI Backend                            |
|                                                               |
|  /api/health                                                  |
|  /api/auth/register                                           |
|  /api/auth/login                                              |
|  /api/auth/me                                                 |
|  /api/scan                                                    |
|  /api/history                                                 |
|  /api/stats                                                   |
+-------------------------------+-------------------------------+
                                |
             +------------------+-------------------+
             |                                      |
+------------v-----------+             +------------v------------+
| Heuristic + ML Engine |             | Optional LLM Provider   |
|                       |             | OpenAI-compatible API   |
| URL rules             |             | - Cautious explanation |
| Text warning rules    |             | - Max 1,200 chars      |
| TF-IDF + logistic     |             | - 12-second timeout     |
| regression            |             +-------------------------+
+------------+-----------+
             |
+------------v-------------------+
| SQLAlchemy / Database Access   |
| SQLite or PostgreSQL           |
+------------+-------------------+
             |
+------------v-------------------+
| users table                    |
| scans table                    |
+--------------------------------+
```

### Request flow

```text
User enters content
        |
        v
React validates scan type and website format
        |
        v
POST /api/scan
        |
        v
Pydantic validates request
        |
        v
URL/text heuristic analysis
        |
        v
TF-IDF + logistic-regression model
        |
        v
Combined risk score
        |
        v
Optional provider explanation
        |
        v
Optional authenticated database save
        |
        v
React report + browser history update
```

---

## How the Scan Works

The backend combines two scoring methods:

1. **Warning-sign heuristics**
   - Calculates points for URL and content indicators.
   - Adds one finding per unique warning code.
   - Produces a heuristic score capped at 100.

2. **Starter machine-learning model**
   - Uses a TF-IDF vectorizer with unigram and bigram features.
   - Uses sublinear term frequency weighting.
   - Uses logistic regression with balanced classes.
   - Appends the scan type to the submitted content before prediction.

The final score is approximately:

```text
Final score = round((heuristic score × 0.8) +
                    (model probability × 100 × 0.2))
```

The model version returned by the API is `starter-tfidf-v1`.

---

## Project Structure

```text
MajorProjectClass/
|
|-- backend/
|   |-- __init__.py          # Backend package
|   |-- classifier.py        # TF-IDF and logistic-regression model
|   |-- database.py          # SQLAlchemy engine and session setup
|   |-- explanations.py      # Optional LLM explanations
|   |-- main.py              # FastAPI application and API routes
|   |-- models.py            # User and ScanRecord database models
|   `-- test_main.py         # Backend and API tests
|
|-- frontend/
|   |-- public/
|   |   |-- favicon.svg
|   |   `-- icons.svg
|   |-- src/
|   |   |-- assets/          # Images and static assets
|   |   |-- App.jsx          # Main application and UI components
|   |   |-- App.css          # Component styles
|   |   |-- index.css        # Global styles and CSS tokens
|   |   `-- main.jsx         # React entry point
|   |-- dist/                # Generated production build
|   |-- .oxlintrc.json       # Oxlint configuration
|   |-- package.json         # Frontend dependencies and scripts
|   |-- package-lock.json
|   `-- vite.config.js       # Vite plugins and API proxy
|
|-- .env.example             # Environment variable template
|-- .gitignore
|-- scamshield.db            # Local SQLite database, generated when used
`-- README.md
```

Generated directories such as `node_modules`, `dist`, `.venv`, `__pycache__`, and database files are intentionally excluded from source control.

---

## Database Design

SQLite is used by default. A database file named `scamshield.db` is created in the project root.

PostgreSQL or Supabase can be selected by setting `DATABASE_URL`.

### `users`

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `email` | String(320) | Unique normalized email address |
| `password_hash` | String(512) | Argon2 password hash |
| `created_at` | DateTime | Account creation time |

### `scans`

| Column | Type | Description |
|---|---|---|
| `id` | Integer | Primary key |
| `user_id` | Foreign Key | Reference to `users.id` |
| `content` | Text | Submitted website or message content |
| `scan_type` | String(20) | `website`, `message`, `email`, or `job` |
| `risk_score` | Integer | Combined risk score |
| `verdict` | String(32) | High risk, Suspicious, or Low risk |
| `created_at` | DateTime | UTC scan timestamp |

Deleting a user cascades deletion of their associated scan records.

Tables are created automatically on application startup using SQLAlchemy metadata. Production schema changes should use migrations because no migration tool is currently included.

### Entity relationship

```text
USERS 1 -------- * SCANS

users.id -> scans.user_id
```

---

## API Documentation

The API uses JSON request and response bodies.

### `GET /api/health`

Returns service status.

```json
{
  "status": "ok",
  "classifier": "starter-tfidf-v1",
  "llm": "configured",
  "database": "sqlite"
}
```

### `POST /api/auth/register`

Creates an account and returns a JWT.

```json
{
  "email": "person@example.com",
  "password": "secure-password-123"
}
```

### `POST /api/auth/login`

Authenticates credentials and returns a JWT.

### `GET /api/auth/me`

Requires a bearer token.

```text
Authorization: Bearer <access-token>
```

### `POST /api/scan`

The bearer token is optional. If supplied, the scan is saved to the account.

```json
{
  "scan_type": "message",
  "content": "URGENT: verify your password immediately"
}
```

Valid `scan_type` values:

- `website`
- `message`
- `email`
- `job`

Example response fields:

| Field | Description |
|---|---|
| `scan_type` | Selected scan category |
| `risk_score` | 0–100 combined score |
| `risk_level` | `low`, `medium`, or `high` |
| `verdict` | `Low risk`, `Suspicious`, or `High risk` |
| `summary` | Short interpretation |
| `findings` | Detected warning signs |
| `recommendation` | Suggested safety action |
| `disclaimer` | Model limitations |
| `model_score` | ML probability converted to a percentage |
| `model_version` | Classifier version |
| `explanation` | Optional provider-generated explanation |
| `explanation_status` | `generated`, `not_configured`, or `unavailable` |
| `saved_to_account` | Whether the scan was persisted |

### `GET /api/history`

Requires a bearer token and returns up to 100 account scans.

### `GET /api/stats`

Requires a bearer token and returns:

- Total scans
- Scans today
- Flagged scans
- Average risk score

### `DELETE /api/history`

Requires a bearer token and deletes the account's scan history.

Interactive documentation is available while FastAPI is running:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

---

## Frontend Features

### Pages and views

- **Overview**: status, metrics, scanner, recent activity, and distribution.
- **Scan history**: local or account scan records.
- **Awareness practice**: interactive fictional scenarios.

### Theme system

The interface supports light and dark themes. Theme selection is saved in `scamshield-theme`.

CSS variables in `frontend/src/index.css` define:

- UI and editorial font families
- 12/14/16/20/28/40px type scale
- 4/8px spacing scale
- Line-height and heading tracking
- Border radii
- Shadow levels
- Content width
- Light and dark color tokens

The design uses max-width content constraints, compact labels, comfortable body line-height, and a consistent 4/8px layout rhythm.

### Local storage

| Key | Data |
|---|---|
| `scamshield-scans` | Up to 20 anonymous scans |
| `scamshield-token` | JWT access token |
| `scamshield-theme` | Selected theme |
| `scamshield-quiz-stats` | Quiz attempts, best score, and last score |

Signed-in account history can contain up to 100 records in the frontend merge and is independently persisted in the database.

---

## Installation

### Requirements

- Windows 10/11, macOS, or Linux
- Python 3.10 or newer
- Node.js 20 or newer
- npm
- Internet access only for package installation and optional LLM use

### 1. Clone or download the project

```powershell
cd C:\path\to\MajorProjectClass
```

### 2. Create a Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
```

For Command Prompt:

```bat
.venv\Scripts\activate.bat
```

For macOS/Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
```

### 3. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

---

## Environment Variables

Copy the example file:

```powershell
Copy-Item .env.example .env
```

| Variable | Required | Default | Purpose |
|---|---:|---|---|
| `SCAMSHIELD_JWT_SECRET` | Recommended; required in production | Ephemeral development secret | Signs JWT access tokens |
| `APP_ENV` | No | `development` | Set to `production` to require a persistent JWT secret |
| `DATABASE_URL` | No | `sqlite:///./scamshield.db` | SQLite or PostgreSQL connection URL |
| `LLM_API_KEY` | No | Not set | Enables AI explanations |
| `LLM_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI-compatible chat-completions URL |
| `LLM_MODEL` | No | `gpt-4o-mini` | Model name sent to the provider |

Example `.env`:

```dotenv
APP_ENV=development
SCAMSHIELD_JWT_SECRET=replace-with-a-long-random-secret

DATABASE_URL=sqlite:///./scamshield.db

LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
```

PostgreSQL example:

```dotenv
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database
```

Do not commit `.env` or real API keys. The local `.gitignore` excludes `.env` and `.venv`.

---

## Running the Application

Open two terminals.

### Terminal 1: FastAPI backend

From the project root:

```powershell
python -m uvicorn backend.main:app --reload --env-file .env
```

Backend URL:

```text
http://127.0.0.1:8000
```

Without a `.env` file:

```powershell
python -m uvicorn backend.main:app --reload
```

### Terminal 2: React frontend

```powershell
cd frontend
npm run dev
```

Vite usually opens:

```text
http://127.0.0.1:5173/
```

Vite proxies `/api` requests to `http://127.0.0.1:8000`.

### Production frontend build

```powershell
cd frontend
npm run build
npm run preview
```

The generated files are placed in `frontend/dist`.

In production, configure the frontend host and backend separately or deploy both behind the same reverse proxy so `/api` resolves to the FastAPI application.

---

## Testing

Run backend tests from the project root:

```powershell
python -m unittest backend.test_main
```

The test suite covers:

- Suspicious-link detection
- Urgent-message detection
- Job-offer fee detection
- Low-risk HTTPS URL behavior
- Relative ML classification
- Account registration
- Duplicate-account prevention
- Login behavior
- Bearer-token authorization
- Account history isolation
- Scan-history clearing
- Account statistics
- Optional LLM behavior
- Mocked LLM explanations

Run frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

The frontend lint command uses Oxlint. The build command verifies that React and Vite can generate a production bundle.

---

## Security and Privacy

### Authentication

- Passwords are hashed using Argon2 through `pwdlib`.
- API authentication uses HS256 JWT bearer tokens.
- Tokens expire after 12 hours.
- A supplied JWT is not required for anonymous scanning.
- Development mode creates an ephemeral JWT secret at startup.
- Production mode refuses to start when `SCAMSHIELD_JWT_SECRET` is missing.

### Privacy

- Anonymous scan history remains in the browser.
- Authenticated scans can be saved to the database.
- Submitted content is sent to the configured LLM provider only when `LLM_API_KEY` is set.
- The frontend reports whether provider explanations are configured or unavailable.
- The scanner does not currently query external reputation databases.
- Browser storage can be cleared through browser settings or application history controls.

### Deployment requirements

Use:

- HTTPS
- A stable, secret JWT key
- Environment-specific database credentials
- Rate limiting
- Reverse-proxy security headers
- Database backups
- A production-grade WSGI/ASGI deployment process

---

## Model and Limitations

The bundled model is trained from a small, illustrative set of 64 scam and safe examples when the backend starts.

Limitations include:

- It is not a validated anti-fraud or anti-phishing service.
- Small training data can miss real-world scam formats.
- Attackers can reword content to evade keyword and text patterns.
- URL heuristics do not verify whether a domain is registered, legitimate, or malicious.
- The model does not inspect the live destination of a link.
- It does not inspect DNS records, certificates, redirect chains, hosted content, or reputation databases.
- The model can produce false positives and false negatives.
- An optional AI explanation is based on supplied findings and can itself make mistakes.
- The UI should not be the sole basis for financial or cybersecurity decisions.

For independent verification, users should navigate to the organization from a trusted browser bookmark or official application, use a verified phone number, and contact the organization through an existing relationship.

---

## Future Improvements

- Train on a larger, representative, regularly evaluated dataset.
- Add live domain reputation and blocklist checks.
- Inspect HTTPS certificates and redirect chains.
- Add database migrations.
- Add refresh-token support and account recovery.
- Add email verification.
- Add rate limiting and abuse protection.
- Add role-based administration.
- Add export and deletion controls.
- Add server-side anonymization and retention policies.
- Add Docker and deployment configuration.
- Add CI/CD pipeline checks.
- Add end-to-end browser tests.
- Add TypeScript or a typed API client.
- Add localization.
- Add accessibility automation.
- Replace auto-created development tables with migration-managed schemas.

---

## Troubleshooting

### Frontend shows “Scanner offline”

1. Confirm that Uvicorn is running.
2. Open `http://127.0.0.1:8000/api/health`.
3. Confirm Vite is still running on port 5173.
4. Restart both servers.

### Port 5173 or 8000 is already in use

Stop the existing process or change the Vite/Uvicorn port.

For Uvicorn:

```powershell
python -m uvicorn backend.main:app --reload --port 8001
```

Update the Vite proxy if the backend uses a different port.

### Account session expired

The JWT has a 12-hour lifetime. Sign in again to create a new session.

### AI explanation not configured

Set `LLM_API_KEY` in `.env` and restart FastAPI. The scanner remains usable without an API key.

### PostgreSQL connection fails

Verify:

- Host and port
- Database name
- Username and password
- SSL requirements
- `psycopg` driver installation
- Correct `postgresql+psycopg://` URL format

### Dependencies are missing

Backend:

```powershell
python -m pip install -r backend\requirements.txt
```

Frontend:

```powershell
cd frontend
npm install
```
