# CelebrAI — AI Celebration & Event Planner

Production-grade full-stack web application designed to plan birthdays, weddings, engagements, anniversaries, college fests, farewell parties, corporate galas, baby showers, and community celebrations with dynamic budget management, run-of-show scheduling, checklist milestone tracking, and formatted PDF export.

---

## 🌟 Fixed Technology Stack

### Backend
- **Python 3.12 / 3.13**
- **FastAPI** (`0.115+`) with lifespan event handling
- **SQLAlchemy 2** ORM with SQLite foreign-key enforcement
- **Pydantic v2** for strict request/response data contracts
- **Google Gen AI Python SDK** (`google-genai`) for live Gemini integration
- **ReportLab** for production-quality multi-page PDF generation
- **pytest** & **FastAPI TestClient** for automated test coverage

### Frontend
- **React 18** with **Vite**
- **TypeScript** with strict mode enabled
- **Tailwind CSS** with warm ivory, deep plum, gold, and rose design tokens
- **React Router DOM v6** (SPA routing with direct-URL navigation)
- **Lucide React** icons
- **Recharts** (Category Donut & Estimated vs Actual Bar Charts)
- **Zod** for multi-step form validation
- **Native Fetch API** client with centralized error normalization

---

## 🚀 Windows PowerShell Quickstart

### 1. Backend Setup & Startup

Open a PowerShell terminal:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
py -3.13 -m venv .venv
# (or: py -3.12 -m venv .venv)

# Upgrade pip and install dependencies
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Create .env from template (configure GEMINI_API_KEY if live AI is desired)
Copy-Item .env.example .env

# Start FastAPI server
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The API will be operational at:
- **API Root:** `http://127.0.0.1:8000`
- **Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/api/v1/health`

---

### 2. Frontend Setup & Startup

In a **separate** PowerShell terminal:

```powershell
# Navigate to frontend directory
cd frontend

# Install pinned dependencies using package-lock.json
npm install
# (or: npm ci)

# Create frontend .env
Copy-Item .env.example .env

# Start Vite development server
npm run dev
```

The web application will open at:
- **Local Application:** `http://localhost:5173/`

---

## 🧪 Automated Testing

### Backend Test Suite
Run pytest against the isolated in-memory SQLite database:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

**Verified Test Coverage (17 Tests):**
- `test_health_endpoint` & `test_config_endpoint`
- `test_create_event_valid` (auto plan generation & seed data)
- `test_create_event_invalid_whitespace_name`
- `test_create_event_invalid_currency` (rejection of unsupported currencies)
- `test_create_event_zero_or_negative_budget`
- `test_get_event` & `test_get_nonexistent_event_returns_404`
- `test_update_event` & `test_delete_event` (cascade deletion)
- `test_expense_crud_and_budget_calculation` (decimal-safe remaining budget calculation)
- `test_add_expense_nonexistent_event_returns_404`
- `test_task_crud_and_completion_tracking`
- `test_invalid_task_priority`
- `test_demo_planner_all_categories` (weddings, birthdays, corporate, college, anniversary, festivals)
- `test_malformed_ai_plan_rejected`
- `test_pdf_export_endpoint` (verifies `%PDF-` header and content generation)

### Frontend Checks
Run TypeScript type-checking and production bundle build:

```powershell
cd frontend
npm run build
```

---

## 📂 Project Architecture

```text
c:\AI event planner\
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI entry point, lifespan, CORS & global handlers
│   │   ├── config.py          # Pydantic BaseSettings & currency whitelist
│   │   ├── database.py        # SQLite engine, pragma foreign keys & get_db
│   │   ├── models.py          # SQLAlchemy 2 models (Event, Expense, ChecklistTask)
│   │   ├── schemas.py         # Pydantic v2 validation contracts & AI plan schema
│   │   ├── routes/
│   │   │   ├── general.py     # Health and safe public config
│   │   │   ├── events.py      # Event CRUD, auto-generation & PDF export
│   │   │   ├── expenses.py    # Expense CRUD & budget calculations
│   │   │   └── tasks.py       # Checklist task CRUD & completion toggling
│   │   ├── services/
│   │   │   ├── ai_service.py   # Google GenAI SDK caller with timeout and fallback
│   │   │   ├── demo_planner.py# Deterministic offline category planner
│   │   │   └── pdf_service.py # ReportLab multi-page document generator
│   │   └── utils/
│   │       └── currency.py    # Decimal-safe money rounding & math
│   ├── tests/
│   │   ├── conftest.py        # Isolated in-memory SQLite fixtures
│   │   ├── test_health.py
│   │   ├── test_events.py
│   │   ├── test_expenses.py
│   │   ├── test_tasks.py
│   │   └── test_ai_and_pdf.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorAlert.tsx
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx       # Route: /
│   │   │   ├── DashboardPage.tsx     # Route: /dashboard
│   │   │   ├── PlanEventPage.tsx     # Route: /plan
│   │   │   ├── EventDetailPage.tsx   # Route: /events/:id
│   │   │   ├── EditEventPage.tsx     # Route: /events/:id/edit
│   │   │   ├── BudgetPage.tsx        # Route: /budget/:eventId
│   │   │   ├── ChecklistPage.tsx     # Route: /checklist/:eventId
│   │   │   ├── IdeasPage.tsx         # Route: /ideas
│   │   │   ├── SettingsPage.tsx      # Route: /settings
│   │   │   └── NotFoundPage.tsx      # Route: *
│   │   ├── hooks/
│   │   │   └── useToast.ts
│   │   ├── services/
│   │   │   ├── api.ts                # Centralized Fetch API client
│   │   │   └── types.ts              # TypeScript interfaces
│   │   ├── schemas/
│   │   │   └── eventSchema.ts        # Zod validation schema
│   │   ├── utils/
│   │   │   ├── currency.ts           # Intl.NumberFormat formatter
│   │   │   └── date.ts               # Date & countdown calculations
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

---

## 🔒 Security & Deployment Boundary

CelebrAI v1 is designed as a single-user local prototype:
- All database state is persisted in `celebrai.db` (SQLite).
- Do not expose the development server on public untrusted networks without adding authentication and access controls.
- API keys are read from environment variables and never sent to the browser.
- Demo mode operates with zero external network dependencies.
