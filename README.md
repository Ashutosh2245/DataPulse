# DataPulse Phase 1 – AI-Powered Data Analytics Platform

A production-ready Minimum Viable Platform (MVP) for uploading datasets, executing automated Exploratory Data Analysis (EDA) using Pandas, and visualizing descriptive statistics and interactive charts.

---

## 📌 Scope & Architecture

DataPulse Phase 1 provides end-to-end functionality for:
- **User Authentication**: Secure user registration and JWT-based session management.
- **File Ingestion**: Robust handling of CSV, Excel (`.xlsx`, `.xls`), and JSON files up to 20MB.
- **Automated Data Processing (Python)**:
  - Deduplication (`df.drop_duplicates()`)
  - Missing value imputation and null count profiling
  - Type conversion and column structure validation
  - Descriptive statistics (mean, median, mode, standard deviation, min/max)
  - Pearson correlation matrix
  - Outlier detection using Interquartile Range (IQR)
  - Visual distribution preparation (histogram bins, scatter coordinates, category bar distributions)
- **Interactive UI (React)**:
  - Authentication views (Login & Register)
  - Dataset management dashboard with status tracking (`pending`, `processing`, `completed`, `error`)
  - Dataset upload form with progress indicator and drag-and-drop support
  - Detailed EDA results view with KPI cards, summary tables, reactive SVG charts, and JSON/CSV report exports.
- **Containerized Microservices Architecture**:
  - React Frontend (Port 3000 / Nginx Port 80)
  - Express.js Backend REST API (Port 8000)
  - Python FastAPI EDA Microservice (Port 5000)
  - PostgreSQL Database (Port 5432)

```
┌────────────────────────────────────────────────────────┐
│                    Users (Browser)                     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │  React Frontend (Port 3000) │
              └─────────────┬─────────────┘
                            │ (REST / JWT)
                            ▼
              ┌───────────────────────────┐
              │  Node/Express API (Port 8000)
              └──────┬──────────────┬─────┘
                     │              │
       (Stores Data) │              │ (Forward File Path / Data)
                     ▼              ▼
       ┌───────────────────┐  ┌───────────────────────────┐
       │   PostgreSQL 15   │  │ Python EDA (Port 5000)    │
       │ (Users, Datasets, │  │ (Pandas, Stats, Charts)   │
       │    Analyses)      │  └───────────────────────────┘
       └───────────────────┘
```

---

## 🗂️ Repository Structure

```
datapulse-phase1/
├── backend/                  # Node.js + Express API service
│   ├── src/
│   │   ├── controllers/      # Route controllers (auth, dataset, health)
│   │   ├── models/           # PostgreSQL data models & connection pool
│   │   ├── routes/           # REST endpoint definitions
│   │   ├── utils/            # JWT middleware, validators, Python EDA client
│   │   └── app.js            # Express app entrypoint
│   ├── tests/                # Jest API tests
│   ├── Dockerfile            # Multi-stage Node 18 Dockerfile
│   └── package.json
├── python-eda/               # Python data processing microservice
│   ├── eda/
│   │   ├── cleaning.py       # Deduplication, imputation, IQR outlier detection
│   │   └── analysis.py       # Stats, correlation matrix, chart data preparation
│   ├── tests/                # Pytest unit & API tests
│   ├── eda_service.py        # FastAPI server entrypoint (Port 5000)
│   ├── requirements.txt      # Python dependencies
│   └── Dockerfile            # Python 3.10 slim Dockerfile
├── frontend/                 # React SPA
│   ├── public/               # HTML template
│   ├── src/
│   │   ├── components/       # UploadForm, Charts, StatsTable, Navbar, ProtectedRoute
│   │   ├── context/          # AuthContext for session management
│   │   ├── pages/            # Login, Register, Dashboard, DatasetDetail
│   │   ├── services/         # Axios API client
│   │   ├── App.js            # React router definitions
│   │   └── index.css         # Modern design system
│   ├── nginx.conf            # Nginx reverse proxy & static SPA routing
│   ├── Dockerfile            # Multi-stage build + Nginx Alpine
│   └── package.json
├── db/
│   └── init.sql              # PostgreSQL schema, constraints, and indexes
├── uploads/                  # Temporary upload storage directory
├── docker-compose.yml        # Multi-container orchestration definition
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions
├── sonar-project.properties  # SonarQube / SonarCloud configuration
├── .github/
│   └── workflows/ci.yml      # GitHub Actions CI/CD Pipeline
└── README.md                 # Complete documentation
```

---

## 💾 Database Schema

The database uses PostgreSQL with 3 core tables:

1. **`users`**
   - `id`: `SERIAL PRIMARY KEY`
   - `name`: `VARCHAR(255) NOT NULL`
   - `email`: `VARCHAR(255) UNIQUE NOT NULL`
   - `password_hash`: `VARCHAR(255) NOT NULL` (Bcrypt)
   - `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

2. **`datasets`**
   - `id`: `SERIAL PRIMARY KEY`
   - `user_id`: `INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
   - `filename`: `VARCHAR(255) NOT NULL`
   - `uploaded_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - `status`: `VARCHAR(50) NOT NULL` (`pending`, `processing`, `completed`, `error`)
   - `s3_key`: `VARCHAR(500)`

3. **`analyses`**
   - `id`: `SERIAL PRIMARY KEY`
   - `dataset_id`: `INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE`
   - `analysis_time`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
   - `summary_json`: `JSONB NOT NULL` (Descriptive stats, metadata, correlation matrix)
   - `charts_json`: `JSONB NOT NULL` (Histogram bins, scatter points, bar counts)

**Indexes:**
- `CREATE INDEX idx_datasets_user_id ON datasets(user_id);`
- `CREATE INDEX idx_analyses_dataset_id ON analyses(dataset_id);`

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL user password | `postgres` |
| `POSTGRES_DB` | PostgreSQL database name | `datapulse` |
| `DB_HOST` | Database host name in Compose network | `postgres` |
| `DB_PORT` | Database port | `5432` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | Required in prod |
| `JWT_EXPIRES_IN`| Token lifespan | `24h` |
| `PORT` | Node.js backend port | `8000` |
| `PYTHON_EDA_URL`| Internal URL to Python service | `http://python-eda:5000` |
| `UPLOAD_DIR` | Local disk storage directory for datasets | `/app/uploads` |
| `DOCKER_REGISTRY`| Docker Hub username / registry namespace | `myhubuser` |
| `IMAGE_TAG` | Immutable Docker image tag | `latest` (or git SHA) |

---

## 🚀 Local Development Setup

### 1. Run Multi-Container Application with Docker Compose

Ensure Docker and Docker Compose are installed, then run:

```bash
# Build and start all services in detached mode
docker-compose up --build -d

# Verify running containers
docker-compose ps

# Follow container logs
docker-compose logs -f
```

### 2. Service Access Points

- **Frontend Web UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **Python EDA API Docs**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **PostgreSQL Database**: `localhost:5432`

---

## 📡 REST API Reference

All endpoints return JSON responses.

### Authentication
- `POST /api/register` - Create new user account.
  ```json
  { "name": "Jane Doe", "email": "jane@example.com", "password": "password123" }
  ```
- `POST /api/login` - Authenticate and receive JWT token.
  ```json
  { "email": "jane@example.com", "password": "password123" }
  ```
- `GET /api/me` - Retrieve current user profile (`Authorization: Bearer <token>`).

### Datasets (Protected with JWT)
- `GET /api/datasets` - List all uploaded datasets for current user.
- `POST /api/datasets` - Upload a dataset file (`multipart/form-data`, field: `file`). Triggers synchronous Pandas EDA processing and returns results.
- `GET /api/datasets/:id` - Fetch details and status for a specific dataset.
- `GET /api/datasets/:id/results` - Fetch full summary JSON and chart visualization payloads.

### System Health
- `GET /api/health` - Simple health check returning `{ "status": "ok" }`.

---

## 🧪 Testing Guide

### 1. Python EDA Unit & Integration Tests (pytest)

```bash
cd python-eda
pip install -r requirements.txt
pytest -v
```

Tests cover:
- Duplicate row removal and verification
- Missing value imputation (numeric mean / categorical mode)
- Outlier calculation via IQR boundaries
- Empty and invalid dataframe rejection
- Health and dataset processing API endpoints

### 2. Backend Unit & Endpoint Tests (Jest + Supertest)

```bash
cd backend
npm install
npm test
```

Tests cover:
- User registration (valid, duplicate email, invalid schema)
- Authentication & JWT token issuing
- Profile route authentication guard (`GET /api/me`)
- Multipart dataset upload handling & validation
- Results retrieval and unauthorized ownership checks
- Service health endpoint

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The CI/CD pipeline is located in `.github/workflows/ci.yml`. On every push to `main` or pull request, the workflow automatically:

1. Checks out the repository code.
2. Sets up Node.js 18, installs dependencies, and runs Jest backend tests.
3. Sets up Python 3.10, installs requirements, and runs pytest test suite.
4. Builds the React frontend application.
5. Runs **SonarQube / SonarCloud** static code analysis for code quality and vulnerability screening.
6. Builds Docker images for `backend`, `frontend`, and `python-eda` tagged with the commit SHA (`$GITHUB_SHA`).
7. Executes **Trivy** vulnerability scans on each image, checking for Critical/High severity CVEs (CVSS >= 7).
8. Logs into **Docker Hub** using encrypted repository secrets and pushes immutable tagged images.

### Required GitHub Secrets
In your GitHub repository under **Settings > Secrets and variables > Actions**, configure:
- `DOCKERHUB_USERNAME`: Your Docker Hub account username.
- `DOCKERHUB_TOKEN`: Docker Hub Personal Access Token (PAT).
- `SONAR_TOKEN`: Token from SonarQube or SonarCloud.
- `SONAR_HOST_URL`: SonarQube server URL (e.g. `https://sonarcloud.io`).

---

## ☁️ AWS EC2 Production Deployment

### 1. EC2 Instance Provisioning
1. Launch an AWS EC2 instance:
   - **AMI**: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   - **Instance Type**: `t3.small` or `t3.medium` (recommended for Docker containers)
   - **Storage**: 20–30 GB gp3 SSD
2. Configure **Security Group** Inbound rules:
   - `SSH` (Port 22) - Restrict to your management IP
   - `HTTP` (Port 80) - `0.0.0.0/0`
   - `HTTPS` (Port 443) - `0.0.0.0/0`
   - `Backend API` (Port 8000) - Optional if exposed directly or routed through Nginx

### 2. Server Configuration
SSH into your instance:
```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>
```

Install Docker and Docker Compose:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and log back in for docker group to take effect
exit
```

### 3. Deploying DataPulse on EC2
Create deployment directory:
```bash
sudo mkdir -p /opt/datapulse
sudo chown -R ubuntu:ubuntu /opt/datapulse
cd /opt/datapulse
```

Copy `docker-compose.yml` and `db/init.sql` to `/opt/datapulse`:
```bash
mkdir -p db
# Copy docker-compose.yml and db/init.sql
```

Create production `.env` file:
```bash
cat << 'EOF' > .env
POSTGRES_USER=postgres
DB_PASSWORD=GenerateAStrongRandomPassword123!
POSTGRES_DB=datapulse
DB_HOST=postgres
DB_PORT=5432
PORT=8000
NODE_ENV=production
JWT_SECRET=ProduceAStrongCryptographicRandomSecretKeyPhase1
JWT_EXPIRES_IN=24h
PYTHON_EDA_URL=http://python-eda:5000
DOCKER_REGISTRY=yourhubuser
IMAGE_TAG=your_specific_commit_sha_or_version
EOF
```

Pull tagged images and start the services:
```bash
# Pull container images built by CI
docker pull yourhubuser/datapulse-backend:$IMAGE_TAG
docker pull yourhubuser/datapulse-frontend:$IMAGE_TAG
docker pull yourhubuser/datapulse-eda:$IMAGE_TAG

# Start the stack in background
docker-compose up -d
```

### 4. Reverse Proxy & SSL (HTTPS) Setup with Let's Encrypt
Install Nginx and Certbot on Ubuntu host:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/datapulse`:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        client_max_body_size 25M;
    }
}
```

Enable site and acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/datapulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🛡️ Rollback Procedure (AWS Well-Architected)

Following AWS Well-Architected Reliability guidelines, immutable tags (e.g. Commit SHAs or semantic version tags like `v1.4.1`) must be used for zero-guesswork rollbacks:

1. **Detect Failure**: If a deployment fails health checks (`/api/health` returns non-200 or containers exit):
2. **Identify Last Known Good Tag**: Retrieve the previous stable image tag (e.g., `v1.4.0` or previous commit SHA `abc1234`).
3. **Update `.env`**:
   ```bash
   cd /opt/datapulse
   sed -i 's/IMAGE_TAG=.*/IMAGE_TAG=abc1234/' .env
   ```
4. **Re-apply Compose**:
   ```bash
   docker-compose up -d
   ```
   Docker Compose will immediately replace faulty containers with the last known good image version without downtime for unchanged services.

---

## 🔍 Troubleshooting

| Issue | Likely Cause | Solution |
|---|---|---|
| Database connection refused | Postgres container still initializing | Ensure `depends_on.condition: service_healthy` is set in compose; check `docker-compose logs postgres`. |
| Python EDA 500 error | Corrupted file or missing header | Check file contents; EDA service requires at least one non-empty column header. |
| Large file upload rejected (413) | Exceeded 20MB limit or Nginx proxy limit | Verify file size <= 20MB; ensure `client_max_body_size 25M` in Nginx config. |
| JWT Authentication 401 | Missing or invalid Bearer token | Ensure `Authorization: Bearer <token>` header is present in requests. |
