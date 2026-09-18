import json
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.metric import Metric
from app.auth.jwt import hash_password, create_access_token

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["docs"] == "/docs"

def test_openapi_docs_endpoint():
    response = client.get("/docs")
    assert response.status_code == 200

def test_openapi_json_specification():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "/auth/register" in schema["paths"]
    assert "/auth/login" in schema["paths"]
    assert "/projects" in schema["paths"]
    assert "/sites" in schema["paths"]
    assert "/sites/{site_id}/metrics" in schema["paths"]
    assert "/sites/{site_id}/spatial-summary" in schema["paths"]

def test_auth_login_invalid_credentials():
    # Attempt login with non-existent user
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/auth/login",
            data={"username": "unknown@darukaa.earth", "password": "wrongpassword"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert response.status_code == 401
        assert "Incorrect email or password" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_auth_register_duplicate_conflict():
    # User already exists in database
    existing = User(
        id="user-1",
        email="existing@darukaa.earth",
        hashed_password=hash_password("password123"),
    )
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = existing

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.post(
            "/auth/register",
            json={"email": "existing@darukaa.earth", "password": "password123"},
        )
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)

def test_projects_endpoints_require_auth():
    # Unauthenticated request to /projects should return 401
    response = client.get("/projects")
    assert response.status_code == 401

def test_sites_endpoints_require_auth():
    # Unauthenticated request to /sites should return 401
    response = client.get("/sites")
    assert response.status_code == 401

def test_metrics_not_found():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        response = client.get("/sites/non-existent-site-id/metrics")
        assert response.status_code == 404
        assert "Site not found" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)
