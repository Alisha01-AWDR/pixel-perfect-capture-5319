import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteResponse, SpatialSummaryResponse, OverlappingSiteInfo
from app.auth.dependencies import get_current_user

router = APIRouter(tags=["Sites"])

def format_site_response(site: Site, db: Session) -> SiteResponse:
    # 1. Fetch GeoJSON coordinates and geodetic area via PostGIS
    query = text("""
        SELECT 
            ST_AsGeoJSON(geometry) AS geojson,
            COALESCE(ST_Area(geometry::geography) / 10000.0, 0) AS area_ha
        FROM sites 
        WHERE id = :sid;
    """)
    result = db.execute(query, {"sid": site.id}).mappings().first()
    
    coordinates: List[List[List[float]]] = []
    area_str = "0 ha"
    if result:
        if result["geojson"]:
            geo_dict = json.loads(result["geojson"])
            coordinates = geo_dict.get("coordinates", [])
        area_ha = result["area_ha"] or 0.0
        if area_ha > 0:
            area_str = f"{area_ha:,.0f} ha"

    return SiteResponse(
        id=str(site.id),
        project_id=str(site.project_id),
        name=site.name,
        area=area_str,
        status=site.status or "forest",
        coordinates=coordinates,
    )

@router.get("/sites", response_model=List[SiteResponse])
def list_sites(
    bbox: Optional[str] = Query(None, description="Bounding box filter: minLng,minLat,maxLng,maxLat"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all sites accessible to the current user.
    Optionally filter by spatial bounding box (minLng, minLat, maxLng, maxLat).
    """
    base_query = db.query(Site).join(Project, Site.project_id == Project.id).filter(Project.created_by == current_user.id)

    if bbox:
        try:
            parts = [float(x.strip()) for x in bbox.split(",")]
            if len(parts) != 4:
                raise ValueError
            min_lng, min_lat, max_lng, max_lat = parts
            base_query = base_query.filter(
                text("ST_Intersects(sites.geometry, ST_MakeEnvelope(:min_lng, :min_lat, :max_lng, :max_lat, 4326))").bindparams(
                    min_lng=min_lng, min_lat=min_lat, max_lng=max_lng, max_lat=max_lat
                )
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid bbox format. Expected 'minLng,minLat,maxLng,maxLat' numbers.",
            )

    sites = base_query.order_by(Site.created_at.desc()).all()
    return [format_site_response(s, db) for s in sites]

@router.get("/projects/{project_id}/sites", response_model=List[SiteResponse])
def list_project_sites(
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
    
    sites = db.query(Site).filter(Site.project_id == project_id).order_by(Site.created_at.desc()).all()
    return [format_site_response(s, db) for s in sites]

@router.post("/projects/{project_id}/sites", response_model=SiteResponse, status_code=status.HTTP_201_CREATED)
def create_site(
    project_id: str,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id, Project.created_by == current_user.id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    geojson_dict = {
        "type": "Polygon",
        "coordinates": payload.coordinates,
    }
    geojson_str = json.dumps(geojson_dict)

    # Use PostGIS ST_SetSRID(ST_GeomFromGeoJSON(...), 4326) to create valid geometry
    try:
        insert_stmt = text("""
            INSERT INTO sites (id, project_id, name, status, geometry, created_at, updated_at)
            VALUES (
                gen_random_uuid()::text,
                :project_id,
                :name,
                :status,
                ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
                NOW(),
                NOW()
            )
            RETURNING id;
        """)
        site_id = db.execute(
            insert_stmt,
            {
                "project_id": project_id,
                "name": payload.name.strip(),
                "status": payload.status or "forest",
                "geojson": geojson_str,
            },
        ).scalar()
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid spatial polygon geometry: {str(exc)}",
        )

    site = db.query(Site).filter(Site.id == site_id).first()
    return format_site_response(site, db)

@router.get("/sites/{site_id}/spatial-summary", response_model=SpatialSummaryResponse)
def get_site_spatial_summary(
    site_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Computes spatial metrics for a site using PostGIS functions:
    geodetic area, perimeter, centroid, bounding box, and intersecting sites.
    """
    site = db.query(Site).join(Project, Site.project_id == Project.id).filter(
        Site.id == site_id,
        Project.created_by == current_user.id,
    ).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    summary_query = text("""
        SELECT 
            s.name,
            COALESCE(ST_Area(s.geometry::geography) / 10000.0, 0) AS area_ha,
            COALESCE(ST_Perimeter(s.geometry::geography), 0) AS perimeter_m,
            ST_X(ST_Centroid(s.geometry)) AS centroid_lng,
            ST_Y(ST_Centroid(s.geometry)) AS centroid_lat,
            ST_XMin(s.geometry) AS min_lng,
            ST_YMin(s.geometry) AS min_lat,
            ST_XMax(s.geometry) AS max_lng,
            ST_YMax(s.geometry) AS max_lat
        FROM sites s
        WHERE s.id = :sid;
    """)
    summary = db.execute(summary_query, {"sid": site_id}).mappings().first()
    if not summary:
        raise HTTPException(status_code=404, detail="Site spatial data unavailable")

    overlap_query = text("""
        SELECT other.id, other.name, other.status
        FROM sites other
        JOIN sites target ON target.id = :sid
        WHERE other.id != :sid
          AND ST_Intersects(other.geometry, target.geometry);
    """)
    overlapping = db.execute(overlap_query, {"sid": site_id}).mappings().all()

    return SpatialSummaryResponse(
        site_id=str(site.id),
        site_name=summary["name"],
        area_ha=round(float(summary["area_ha"]), 2),
        perimeter_meters=round(float(summary["perimeter_m"]), 2),
        centroid=[float(summary["centroid_lng"]), float(summary["centroid_lat"])],
        bbox=[
            float(summary["min_lng"]),
            float(summary["min_lat"]),
            float(summary["max_lng"]),
            float(summary["max_lat"]),
        ],
        overlapping_sites=[
            OverlappingSiteInfo(id=str(o["id"]), name=o["name"], status=o["status"])
            for o in overlapping
        ],
    )
