import pytest
from pydantic import ValidationError
from app.schemas.project import ProjectCreate, ProjectResponse

def test_project_create_schema():
    p = ProjectCreate(name="Atlantic Forest Corridor", description="Core restoration zone")
    assert p.name == "Atlantic Forest Corridor"
    assert p.description == "Core restoration zone"
    assert p.status == "active"

def test_project_response_schema():
    resp = ProjectResponse(
        id="proj-1234",
        name="Atlantic Forest Corridor",
        description="Core zone",
        area="12,480 ha",
        sites=4,
        progress=95,
        status="active",
    )
    assert resp.area == "12,480 ha"
    assert resp.sites == 4
    assert resp.progress == 95

def test_project_create_empty_name_fails():
    with pytest.raises(ValidationError):
        ProjectCreate(name="")
