from datetime import date
from pydantic import BaseModel
from app.schemas.metric import to_time_series_metrics, MetricItem

class MockMetricRow:
    def __init__(self, date_val, carbon, bio, canopy):
        self.date = date_val
        self.carbon_value = carbon
        self.biodiversity_value = bio
        self.canopy_value = canopy

def test_to_time_series_metrics_unpivots_correctly():
    rows = [
        MockMetricRow(date(2026, 6, 1), 4.148, 0.874, 71.02),
        MockMetricRow(date(2025, 12, 1), 3.812, 0.841, 69.84),
    ]

    items = to_time_series_metrics(rows)
    assert len(items) == 6  # 2 rows * 3 metrics each = 6 entries

    # Verify order: newest date first
    assert items[0].recorded_at == "2026-06-01"
    assert items[0].metric_type == "carbon"
    assert items[0].value == 4.15

    assert items[1].recorded_at == "2026-06-01"
    assert items[1].metric_type == "biodiversity"
    assert items[1].value == 0.87

    assert items[2].recorded_at == "2026-06-01"
    assert items[2].metric_type == "canopy"
    assert items[2].value == 71.0

    # Next date
    assert items[3].recorded_at == "2025-12-01"
    assert items[3].metric_type == "carbon"
    assert items[3].value == 3.81

def test_empty_metrics_handling():
    items = to_time_series_metrics([])
    assert items == []
