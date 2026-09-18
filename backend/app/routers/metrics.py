from datetime import date as dt_date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.site import Site
from app.models.metric import Metric
from app.schemas.metric import MetricItem, MetricCreate, to_time_series_metrics
from app.auth.dependencies import get_current_user
from app.models.user import User

router = APIRouter(tags=["Metrics"])

@router.get("/sites/{site_id}/metrics", response_model=List[MetricItem])
def get_site_metrics(
    site_id: str,
    db: Session = Depends(get_db),
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    
    metrics = db.query(Metric).filter(Metric.site_id == site_id).order_by(Metric.date.desc()).all()
    if not metrics:
        return seed_site_metrics(site_id, db)
    return to_time_series_metrics(metrics)

@router.post("/sites/{site_id}/metrics", response_model=List[MetricItem], status_code=status.HTTP_201_CREATED)
def create_site_metric(
    site_id: str,
    payload: MetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    record_date = payload.date or dt_date.today()
    metric_entry = Metric(
        site_id=site_id,
        date=record_date,
        carbon_value=payload.carbon_value,
        biodiversity_value=payload.biodiversity_value,
        canopy_value=payload.canopy_value,
    )
    db.add(metric_entry)
    db.commit()

    # Return full unpivoted time series
    all_metrics = db.query(Metric).filter(Metric.site_id == site_id).order_by(Metric.date.desc()).all()
    return to_time_series_metrics(all_metrics)

@router.post("/sites/{site_id}/metrics/seed-mock-data", response_model=List[MetricItem])
def seed_site_metrics(
    site_id: str,
    db: Session = Depends(get_db),
):
    """
    Seeds realistic baseline time series metrics for a newly mapped monitoring site.
    Expected by frontend 'Generate demo data' flow.
    """
    site = db.query(Site).filter(Site.id == site_id).first()
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )

    today = dt_date.today()
    h = sum(ord(c) for c in (site.name + str(site.id)))
    offset_c = ((h % 15) - 7) * 0.15
    offset_b = ((h % 11) - 5) * 0.02
    offset_k = ((h % 17) - 8) * 1.5

    if site.status == "degraded":
        c_val = max(1.5, round(2.3 + offset_c, 2))
        b_val = max(0.50, min(0.75, round(0.64 + offset_b, 2)))
        k_val = max(40.0, min(60.0, round(48.5 + offset_k, 1)))
    elif site.status == "water":
        c_val = max(2.0, round(3.4 + offset_c, 2))
        b_val = max(0.70, min(0.96, round(0.92 + offset_b, 2)))
        k_val = max(55.0, min(75.0, round(66.0 + offset_k, 1)))
    else:
        c_val = max(3.2, round(4.15 + offset_c, 2))
        b_val = max(0.75, min(0.98, round(0.88 + offset_b, 2)))
        k_val = max(65.0, min(92.0, round(72.4 + offset_k, 1)))

    sample_readings = [
        {"date": today, "carbon": c_val, "bio": b_val, "canopy": k_val},
        {"date": today - timedelta(days=90), "carbon": round(c_val * 0.96, 2), "bio": round(max(0.3, b_val - 0.03), 2), "canopy": round(k_val - 1.6, 1)},
        {"date": today - timedelta(days=180), "carbon": round(c_val * 0.92, 2), "bio": round(max(0.3, b_val - 0.05), 2), "canopy": round(k_val - 3.2, 1)},
        {"date": today - timedelta(days=270), "carbon": round(c_val * 0.88, 2), "bio": round(max(0.3, b_val - 0.07), 2), "canopy": round(k_val - 4.9, 1)},
        {"date": today - timedelta(days=360), "carbon": round(c_val * 0.84, 2), "bio": round(max(0.3, b_val - 0.09), 2), "canopy": round(k_val - 6.4, 1)},
    ]

    for item in sample_readings:
        exists = db.query(Metric).filter(Metric.site_id == site_id, Metric.date == item["date"]).first()
        if not exists:
            db.add(Metric(
                site_id=site_id,
                date=item["date"],
                carbon_value=item["carbon"],
                biodiversity_value=item["bio"],
                canopy_value=item["canopy"],
            ))
    db.commit()

    all_metrics = db.query(Metric).filter(Metric.site_id == site_id).order_by(Metric.date.desc()).all()
    return to_time_series_metrics(all_metrics)
