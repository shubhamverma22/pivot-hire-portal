# PivotHire — MVP Hiring Platform

A full-stack hiring platform where **ex-founders** can create profiles, subscribe, browse jobs, and apply — and **companies** can post jobs, filter candidates, and manage the hiring pipeline.

---

## Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React 18, React Router, Tailwind CSS, Vite |
| Backend    | FastAPI, SQLAlchemy (async), Pydantic v2   |
| Database   | PostgreSQL 16                              |
| Auth       | JWT + bcrypt (+ Google OAuth ready)        |
| Payments   | Razorpay integration (with demo fallback)  |
| Email      | SendGrid (for password reset emails)       |
| DevOps     | Docker Compose, ready for AWS deployment   |

---

## Features

### Ex-Founder Dashboard
- Email / Google sign-up & login
- Profile setup (startup experience, skills, LinkedIn/resume links)
- Subscription system: **Free** (5 apps/month) and **Premium** (₹1,999/month, unlimited)
- Browse jobs with filters (search, location, role type)
- Apply to jobs with cover letter
- Track application status (Applied → Viewed → Shortlisted → Rejected)

### Company Dashboard
- Email / Google sign-up & login (with company name & logo)
- Post jobs (title, role type, salary range, location, description, required skills)
- View applicants per job
- Filter candidates by skill, experience, location
- Shortlist or reject candidates with full profile view

### Subscription Logic
| Plan    | Price      | Application Limit | Notes                |
|---------|------------|-------------------|----------------------|
| Free    | ₹0         | 5 per month       | Basic access         |
| Premium | ₹1,999/mo  | Unlimited         | Boosted visibility   |

---

## Quick Start

### Option 1: Docker Compose (recommended)

```bash
# Clone and start everything
cd pivothire
docker compose up -d

# Seed demo data
docker compose exec backend python seed.py

# Open the app
open http://localhost:5173
```

### Option 2: Manual Setup

#### 1. Database
```bash
# Create PostgreSQL database
createdb pivothire
```

#### 2. Backend
```bash
cd backend

# Create .env from example
cp .env.example .env
# Edit .env with your database URL if different

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run the server (auto-creates tables on startup)
uvicorn main:app --reload --port 8000

# In another terminal, seed demo data
python seed.py
```

#### 3. Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run dev server (proxies /api to backend)
npm run dev
```

#### 4. Open the app
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/api/docs

---

## Demo Accounts

After running `seed.py`:

| Role     | Email              | Password     |
|----------|--------------------|--------------|
| Founder  | alex@example.com   | password123  |
| Founder  | priya@example.com  | password123  |
| Founder  | james@example.com  | password123  |
| Company  | hire@acme.com      | password123  |
| Company  | hr@globex.com      | password123  |

---

## API Endpoints

### Authentication
```
POST /api/auth/register/founder  — Register as ex-founder
POST /api/auth/register/company  — Register as company
POST /api/auth/login             — Email + password login
POST /api/auth/google            — Google OAuth login
GET  /api/auth/me                — Current user info
```

### Profiles
```
GET  /api/profile/founder        — Get founder profile
PUT  /api/profile/founder        — Update founder profile
GET  /api/profile/company        — Get company profile
PUT  /api/profile/company        — Update company profile
```

### Jobs
```
GET    /api/jobs                 — Browse jobs (with filters)
GET    /api/jobs/{id}            — Job detail
POST   /api/jobs                 — Post new job (company only)
PATCH  /api/jobs/{id}            — Update job
DELETE /api/jobs/{id}            — Delete job
GET    /api/jobs/my/postings     — Company's own jobs
```

### Applications
```
POST  /api/applications          — Apply to job (enforces subscription limit)
GET   /api/applications/my       — Founder's applications
GET   /api/applications/job/{id} — Company: applicants for a job (with filters)
PATCH /api/applications/{id}     — Update status (shortlist/reject)
```

### Password Reset
```
POST /api/auth/forgot-password   — Send password reset email
POST /api/auth/reset-password    — Reset password with token
```

### Subscription
```
GET  /api/subscription           — Current subscription status
POST /api/subscription/checkout  — Create Razorpay subscription
POST /api/subscription/verify    — Verify Razorpay payment signature
POST /api/subscription/webhook   — Razorpay webhook handler
POST /api/subscription/cancel    — Cancel premium
```

### Dashboard
```
GET /api/dashboard/founder       — Founder dashboard stats
GET /api/dashboard/company       — Company dashboard stats
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/pivothire
SECRET_KEY=your-secret-key-here

# Optional: Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Optional: Razorpay (leave blank for demo mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_PLAN_ID_PREMIUM=

# Optional: SendGrid (leave blank to print reset links to console)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@pivothire.com
```

> **Demo mode**: When `RAZORPAY_KEY_ID` is empty, the checkout endpoint auto-upgrades to Premium — perfect for testing without Razorpay.
>
> **Email fallback**: When `SENDGRID_API_KEY` is empty, password reset links are printed to the backend console — perfect for development.

---

## Project Structure

```
pivothire/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Settings / env vars
│   ├── database.py          # Async SQLAlchemy setup
│   ├── models.py            # All database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # JWT, password hashing, dependencies
│   ├── seed.py              # Demo data seeder
│   ├── requirements.txt
│   ├── Dockerfile
│   └── routes/
│       ├── auth_routes.py
│       ├── password_routes.py
│       ├── profile_routes.py
│       ├── job_routes.py
│       ├── application_routes.py
│       ├── subscription_routes.py
│       └── dashboard_routes.py
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Routing with role-based guards
│       ├── index.css         # Tailwind + component styles
│       ├── api/
│       │   └── client.js     # API client with auth interceptor
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── UI.jsx        # Shared components
│       │   └── DashboardLayout.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── RegisterPage.jsx
│           ├── FounderDashboard.jsx
│           ├── CompanyDashboard.jsx
│           ├── BrowseJobsPage.jsx
│           ├── MyApplicationsPage.jsx
│           ├── FounderProfilePage.jsx
│           ├── SubscriptionPage.jsx
│           ├── ForgotPasswordPage.jsx
│           ├── ResetPasswordPage.jsx
│           ├── PostJobPage.jsx
│           ├── MyJobsPage.jsx
│           ├── ManageCandidatesPage.jsx
│           └── CompanyProfilePage.jsx
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## AWS Deployment Guide

### Using EC2 + Docker

```bash
# 1. Launch EC2 instance (Ubuntu 22.04, t3.small+)
# 2. SSH in and install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER

# 3. Clone repo and configure
git clone <repo-url> pivothire && cd pivothire
cp backend/.env.example backend/.env
# Edit .env with production values (RDS URL, real secret key, Razorpay keys, SendGrid key)

# 4. Build and run
docker compose -f docker-compose.yml up -d --build

# 5. Seed data (optional for production)
docker compose exec backend python seed.py

# 6. Set up Nginx reverse proxy + SSL with Let's Encrypt
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Using RDS for PostgreSQL
Replace `DATABASE_URL` with your RDS endpoint:
```
DATABASE_URL=postgresql+asyncpg://user:pass@your-rds.amazonaws.com:5432/pivothire
```

---

## License

Private — Built for PivotHire.
