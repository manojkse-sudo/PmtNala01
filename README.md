# NalaBase 🩺

**Production-quality Multi-tenant Electronic Medical Records** for independent doctors and small clinics.

> Built like Linear. Designed for doctors.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, React Query, Zustand |
| Backend | FastAPI, SQLAlchemy (async), Alembic, Pydantic v2 |
| Database | PostgreSQL (Neon) |
| Auth | JWT (access + refresh tokens) |
| Deploy | Frontend → Vercel · Backend → Railway · DB → Neon |

---

## Architecture

### Multi-Tenancy
Every table carries `doctor_id` as a non-nullable, indexed FK to the `doctors` table. Tenant isolation is enforced at the **repository layer** — every query filters by `doctor_id`. No row-level security required at the DB layer (though Neon RLS can be added as an additional defence-in-depth).

```
Doctor (Tenant Root)
  └── Patient (doctor_id)
        ├── Appointment (doctor_id)
        ├── MedicalRecord (doctor_id) → SOAP notes + prescriptions
        └── Vitals (doctor_id)
```

### Backend Layers
```
API Endpoint → Service → Repository → Model → DB
```
- **Repository**: Pure DB access, tenant-filtered queries, no business logic
- **Service**: Business rules, cross-repo orchestration, HTTP error raising
- **Endpoint**: Request parsing, auth injection, response shaping

### Frontend Layers
```
Page → React Query Hook → API Service → Axios Client (with JWT interceptor)
                                             ↓
                                     Zustand (auth + UI state)
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Set env vars
cp .env.example .env
# Edit DATABASE_URL, SECRET_KEY

# Run migrations
alembic upgrade head

# Start dev server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install

# Set env vars
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
```

App: http://localhost:3000

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create doctor account |
| POST | `/api/v1/auth/login` | Get tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current doctor |
| PATCH | `/api/v1/auth/me` | Update profile |

### Patients
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/patients` | List patients (with search) |
| POST | `/api/v1/patients` | Create patient |
| GET | `/api/v1/patients/{id}` | Get patient |
| PATCH | `/api/v1/patients/{id}` | Update patient |
| DELETE | `/api/v1/patients/{id}` | Soft delete patient |

### Appointments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/appointments` | List (filter by status/date/patient) |
| GET | `/api/v1/appointments/today` | Today's schedule |
| GET | `/api/v1/appointments/stats` | Counts by status |
| POST | `/api/v1/appointments` | Book appointment |
| PATCH | `/api/v1/appointments/{id}` | Update / change status |
| DELETE | `/api/v1/appointments/{id}` | Soft delete |

### Medical Records
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/records` | Create SOAP record |
| GET | `/api/v1/records/{id}` | Get record |
| PATCH | `/api/v1/records/{id}` | Update record |
| GET | `/api/v1/records/patient/{id}` | All records for patient |
| POST | `/api/v1/records/patient/{id}/vitals` | Record vitals |
| GET | `/api/v1/records/patient/{id}/vitals` | Vitals history |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/dashboard/stats` | Aggregated counts |

---

## Deployment

### Backend → Railway

1. Create a Railway project, connect GitHub repo
2. Set root directory to `backend/`
3. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `SECRET_KEY` (generate: `openssl rand -hex 32`)
   - `ALLOWED_ORIGINS` (your Vercel URL)
   - `APP_ENV=production`
   - `DEBUG=false`
4. Railway auto-detects `railway.toml` and builds the Dockerfile

### Frontend → Vercel

1. Import repo into Vercel
2. Set root directory to `frontend/`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` (your Railway backend URL + `/api/v1`)
4. Deploy

### Database → Neon

1. Create a Neon project
2. Copy the connection string (use the **pooled** connection with `?sslmode=require`)
3. Use as `DATABASE_URL` in Railway

---

## Security Notes

- JWT access tokens expire in 60 minutes; refresh tokens in 30 days
- Passwords hashed with bcrypt (cost factor 12)
- All tenant queries enforce `doctor_id` — no cross-tenant data leakage possible at the application layer
- CORS configured to only allow your Vercel domain in production
- Soft deletes preserve audit trail
- UUIDs as primary keys prevent enumeration attacks

---

## Brand

| Token | Value |
|---|---|
| Primary | `#3B1F5C` |
| Secondary | `#00B8A9` |
| Accent | `#B8A1E3` |
| Background | `#FCFCFD` |
| Font | Inter |

---

## Project Structure

```
nalabase/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers
│   │   ├── core/               # Config, DB, Security
│   │   ├── middleware/         # Logging
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── repositories/       # Data access layer
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic layer
│   │   └── main.py
│   ├── alembic/               # DB migrations
│   ├── Dockerfile
│   ├── railway.toml
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/         # Login, Register
    │   │   └── (dashboard)/    # Protected pages
    │   ├── components/
    │   │   ├── layout/         # Sidebar, Topbar
    │   │   ├── shared/         # AuthGuard
    │   │   └── ui/             # Button, Input, Card, Modal, Toast
    │   ├── hooks/              # React Query hooks
    │   ├── lib/                # API client, utils
    │   ├── store/              # Zustand (auth, ui)
    │   └── types/              # TypeScript domain types
    ├── public/
    │   └── manifest.json       # PWA manifest
    └── vercel.json
```
