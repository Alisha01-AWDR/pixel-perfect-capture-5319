# Script: setup_db.ps1
# Automates PostgreSQL database setup and Alembic migrations for Darukaa.Earth on Windows

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Darukaa.Earth Database & Migration Setup " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot ".env"
$envExample = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    Write-Host "`n[.env] No .env file found in backend directory." -ForegroundColor Yellow
    $dbPass = Read-Host -Prompt "Enter password for PostgreSQL user 'postgres'" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPass)
    $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

    $secretKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
    $content = @"
DATABASE_URL=postgresql+psycopg://postgres:$plainPass@localhost:5432/darukaa
JWT_SECRET_KEY=$secretKey
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000
"@
    Set-Content -Path $envFile -Value $content
    Write-Host "[OK] Created backend/.env" -ForegroundColor Green
}

# Find psql
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe"
)
$psql = $psqlPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($psql) {
    Write-Host "`n[PostgreSQL] Found: $psql" -ForegroundColor Green
    Write-Host "[PostgreSQL] Creating database 'darukaa' if not exists..." -ForegroundColor Cyan
    & $psql -U postgres -h localhost -p 5432 -c "SELECT 1 FROM pg_database WHERE datname = 'darukaa'" | Out-Null
    & $psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE darukaa;" 2>$null
    Write-Host "[PostGIS] Enabling PostGIS extension in 'darukaa'..." -ForegroundColor Cyan
    & $psql -U postgres -h localhost -p 5432 -d darukaa -c "CREATE EXTENSION IF NOT EXISTS postgis;"
} else {
    Write-Host "[WARN] psql.exe not found in standard paths. Ensure database 'darukaa' and 'postgis' extension are enabled." -ForegroundColor Yellow
}

# Run Alembic migrations
Write-Host "`n[Alembic] Running database migrations..." -ForegroundColor Cyan
$python = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $python)) {
    $python = "python"
}

Push-Location $PSScriptRoot
try {
    & $python -m alembic upgrade head
    Write-Host "[OK] Alembic migrations applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Migration failed: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " Setup complete! You can now run:" -ForegroundColor Green
Write-Host "   python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Green
