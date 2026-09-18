from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.models.metric import Metric
from app.schemas.project import ProjectCreate, ProjectResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

def build_project_response(project: Project, db: Session) -> ProjectResponse:
    # 1. Total site count
    site_ids = [s.id for s in project.sites]
    sites_count = len(site_ids)

    # 2. Dynamic geodetic area calculation using PostGIS
    area_str = "0 ha"
    if sites_count > 0:
        total_ha = db.execute(
            text("SELECT COALESCE(SUM(ST_Area(geometry::geography) / 10000.0), 0) FROM sites WHERE project_id = :pid;"),
            {"pid": project.id},
        ).scalar() or 0.0
        if total_ha > 0:
            area_str = f"{total_ha:,.0f} ha"

    # 3. Dynamic progress calculation based on site telemetry / metrics coverage
    progress = 0
    if sites_count > 0:
        sites_with_metrics = db.execute(
            text("SELECT COUNT(DISTINCT site_id) FROM metrics WHERE site_id = ANY(:sids);"),
            {"sids": site_ids},
        ).scalar() or 0
        progress = int(round((sites_with_metrics / sites_count) * 100))

    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        description=project.description,
        area=area_str,
        sites=sites_count,
        progress=min(100, max(0, progress)),
        status=project.status or "active",
    )

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).filter(Project.created_by == current_user.id).order_by(Project.created_at.desc()).all()
    return [build_project_response(p, db) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_project = Project(
        name=payload.name.strip(),
        description=payload.description,
        status=payload.status or "active",
        created_by=current_user.id,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return build_project_response(new_project, db)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return build_project_response(project, db)
