# Darukaa.Earth Backend

Production-grade FastAPI backend for the Darukaa.Earth ecological and landscape monitoring platform, powered by PostgreSQL 18, PostGIS 3.6+, SQLAlchemy 2.x, GeoAlchemy2, PyJWT authentication, and Alembic migrations.

---

## Architecture & Features

- **Framework**: FastAPI (Python 3.10+) with Uvicorn
- **Database**: PostgreSQL 18 with PostGIS 3.6+ extension
- **ORM & GIS**: SQLAlchemy 2.x + GeoAlchemy2 with geodetic spatial calculations
- **Spatial Features**:
  - `GEOMETRY(POLYGON, 4326)` for site boundaries
  - Geodetic area calculation: `ST_Area(geometry::geography) / 10000.0` (in hectares)
  - Perimeter calculation: `ST_Perimeter(geometry::geography)` (in meters)
  - Centroid and bounding box extraction
  - Intersecting / adjacent site detection: `ST_Intersects`
  - Bounding box filtering on site queries
- **Authentication**: JWT access tokens (PyJWT) with bcrypt password hashing
- **Frontend Compatibility**: Matches `src/lib/darukaa.ts` without needing changes to UI components
- **Migrations**: Alembic versioning with spatial geometry support

---

## Windows Quickstart

### 1. Python Setup
Ensure Python 3.10+ is installed and accessible in your PATH:
```powershell
python --version
```

### 2. Virtual Environment Setup
From the repository root or `backend` folder, create and activate a virtual environment:
```powershell
cd d:\pixel-perfect-capture-5319\backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Installing Requirements
Install all backend dependencies:
```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. PostgreSQL Configuration
PostgreSQL 18 is running as a Windows service (`postgresql-x64-18`) on `localhost:5432`.
Connect to PostgreSQL and create the `darukaa` database:
```powershell
# Using psql:
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE darukaa;"
```

### 5. PostGIS Requirement
Enable the PostGIS extension inside the `darukaa` database:
```powershell
psql -U postgres -h localhost -p 5432 -d darukaa -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```
You can verify the installed version with:
```sql
SELECT PostGIS_Full_Version();
```

### 6. Environment Variables
Copy `.env.example` to `.env` in the `backend` directory:
```powershell
Copy-Item .env.example .env
```
Edit `.env` with your PostgreSQL password and a strong JWT secret:
```env
DATABASE_URL=postgresql+psycopg://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/darukaa
JWT_SECRET_KEY=super_secret_darukaa_earth_production_key_2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
```

### 7. Alembic Database Migrations
Run the initial migration to create `users`, `projects`, `sites` (with PostGIS polygon), and `metrics`:
```powershell
python -m alembic upgrade head
```

### 8. Starting FastAPI
Start the backend server in development reload mode:
```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The server will boot and verify PostGIS extension availability on startup.

### 9. API Documentation
Once running, open your browser:
- Interactive Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc UI: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 10. Connecting the Existing React Frontend
In the root directory of the project, create `.env.local`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```
Start the frontend development server:
```powershell
npm run dev
```
The React frontend in `src/lib/darukaa.ts` detects `VITE_API_BASE_URL` and switches from demo fallback mode to the live FastAPI backend.

---

## API Endpoints Overview

| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register a new user account |
| `POST` | `/auth/login` | No | Authenticate and obtain JWT access token |
| `GET` | `/projects` | Yes | List projects with dynamic PostGIS area & progress |
| `POST` | `/projects` | Yes | Create a new project |
| `GET` | `/projects/{id}` | Yes | Retrieve project details |
| `GET` | `/sites` | Yes | List all sites (supports `?bbox=minLng,minLat,maxLng,maxLat`) |
| `GET` | `/projects/{project_id}/sites` | Yes | List sites belonging to a project |
| `POST` | `/projects/{project_id}/sites` | Yes | Create a site with PostGIS polygon geometry |
| `GET` | `/sites/{site_id}/spatial-summary` | Yes | PostGIS area, perimeter, centroid, bbox, and overlapping sites |
| `GET` | `/sites/{site_id}/metrics` | No / Optional | Time-series biometric history (carbon, biodiversity, canopy) |
| `POST` | `/sites/{site_id}/metrics` | Yes | Record biometric monitoring reading |
| `POST` | `/sites/{site_id}/metrics/seed-mock-data` | No / Optional | Seed baseline monitoring telemetry for new sites |

---

## Running Tests

Run the test suite:
```powershell
pytest -v
```
Tests cover:
- Password hashing and JWT encoding/verification
- PostGIS polygon coordinates validation and auto-closing
- Metric row unpivoting (`to_time_series_metrics`)
- Project progress boundaries and schema verification
