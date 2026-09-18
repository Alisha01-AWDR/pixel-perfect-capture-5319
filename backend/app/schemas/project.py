from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = "Created from Darukaa.Earth"
    status: Optional[str] = "active"

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    area: str = "0 ha"
    sites: int = 0
    progress: int = 0
    status: str = "active"

    model_config = ConfigDict(from_attributes=True)
