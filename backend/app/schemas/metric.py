from datetime import date as dt_date
from typing import Literal, Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict

class MetricItem(BaseModel):
    metric_type: Literal["carbon", "biodiversity", "canopy"]
    value: float
    recorded_at: str

    model_config = ConfigDict(from_attributes=True)

class MetricCreate(BaseModel):
    date: Optional[dt_date] = None
    carbon_value: float = Field(..., ge=0.0)
    biodiversity_value: float = Field(..., ge=0.0)
    canopy_value: float = Field(..., ge=0.0, le=100.0)

def to_time_series_metrics(metric_rows: List[Any]) -> List[MetricItem]:
    """
    Transforms database wide-table metric rows (date, carbon_value, biodiversity_value, canopy_value)
    into a flat time-series list expected by the React frontend charts:
    [{ metric_type, value, recorded_at }, ...]
    """
    items: List[MetricItem] = []
    # Sort rows by date descending
    sorted_rows = sorted(metric_rows, key=lambda r: r.date, reverse=True)
    for row in sorted_rows:
        rec_date = row.date.isoformat() if hasattr(row.date, "isoformat") else str(row.date)
        items.append(MetricItem(
            metric_type="carbon",
            value=round(float(row.carbon_value), 2),
            recorded_at=rec_date,
        ))
        items.append(MetricItem(
            metric_type="biodiversity",
            value=round(float(row.biodiversity_value), 2),
            recorded_at=rec_date,
        ))
        items.append(MetricItem(
            metric_type="canopy",
            value=round(float(row.canopy_value), 1),
            recorded_at=rec_date,
        ))
    return items
