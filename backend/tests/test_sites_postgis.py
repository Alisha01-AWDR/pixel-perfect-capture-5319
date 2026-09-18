import pytest
from pydantic import ValidationError
from app.schemas.site import SiteCreate

def test_site_create_valid_polygon():
    valid_coords = [
        [
            [-47.0, -22.0],
            [-47.1, -22.0],
            [-47.1, -22.1],
            [-47.0, -22.0],
        ]
    ]
    site = SiteCreate(name="Atlantic Restoration Site 01", coordinates=valid_coords)
    assert site.name == "Atlantic Restoration Site 01"
    assert len(site.coordinates[0]) == 4
    assert site.coordinates[0][0] == site.coordinates[0][-1]

def test_site_create_auto_closes_polygon():
    unclosed_coords = [
        [
            [-47.0, -22.0],
            [-47.1, -22.0],
            [-47.1, -22.1],
        ]
    ]
    site = SiteCreate(name="Unclosed Site", coordinates=unclosed_coords)
    # Automatically closed by validator
    assert len(site.coordinates[0]) == 4
    assert site.coordinates[0][0] == site.coordinates[0][-1]

def test_site_create_invalid_coordinates_out_of_bounds():
    out_of_bounds = [
        [
            [195.0, -22.0],  # Invalid longitude > 180
            [-47.1, -22.0],
            [-47.1, -22.1],
            [195.0, -22.0],
        ]
    ]
    with pytest.raises(ValidationError):
        SiteCreate(name="Invalid Coordinates", coordinates=out_of_bounds)

def test_site_create_insufficient_points():
    too_few_points = [
        [
            [-47.0, -22.0],
            [-47.1, -22.0],
        ]
    ]
    with pytest.raises(ValidationError):
        SiteCreate(name="Too few vertices", coordinates=too_few_points)
