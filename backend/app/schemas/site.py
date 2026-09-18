from typing import List, Optional, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

class SiteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    status: Optional[str] = "forest"
    coordinates: List[List[List[float]]]

    @field_validator("coordinates")
    @classmethod
    def validate_polygon_coordinates(cls, v: List[List[List[float]]]) -> List[List[List[float]]]:
        if not v or len(v) < 1:
            raise ValueError("Coordinates must contain at least one linear ring (exterior polygon ring).")
        
        exterior_ring = v[0]
        if len(exterior_ring) < 3:
            raise ValueError("Polygon exterior ring must have at least 3 points.")
        
        for idx, pt in enumerate(exterior_ring):
            if len(pt) < 2:
                raise ValueError(f"Point at index {idx} must have [longitude, latitude].")
            lng, lat = pt[0], pt[1]
            if not (-180.0 <= lng <= 180.0):
                raise ValueError(f"Longitude {lng} out of range [-180, 180].")
            if not (-90.0 <= lat <= 90.0):
                raise ValueError(f"Latitude {lat} out of range [-90, 90].")
        
        # Ensure polygon ring is closed
        first = exterior_ring[0]
        last = exterior_ring[-1]
        if first[0] != last[0] or first[1] != last[1]:
            v[0] = exterior_ring + [first]

        if len(v[0]) < 4:
            raise ValueError("A closed polygon ring requires at least 4 coordinates (3 unique vertices + closing).")

        return v

class SiteResponse(BaseModel):
    id: str
    project_id: str
    name: str
    area: str
    status: str
    coordinates: List[List[List[float]]]

    model_config = ConfigDict(from_attributes=True)

class OverlappingSiteInfo(BaseModel):
    id: str
    name: str
    status: str

class SpatialSummaryResponse(BaseModel):
    site_id: str
    site_name: str
    area_ha: float
    perimeter_meters: float
    centroid: List[float]  # [longitude, latitude]
    bbox: List[float]  # [min_lng, min_lat, max_lng, max_lat]
    overlapping_sites: List[OverlappingSiteInfo]
