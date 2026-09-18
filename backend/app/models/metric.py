import uuid
from datetime import datetime, timezone, date as dt_date
from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    site_id = Column(String(36), ForeignKey("sites.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, default=dt_date.today, nullable=False)
    carbon_value = Column(Float, nullable=False, default=0.0)
    biodiversity_value = Column(Float, nullable=False, default=0.0)
    canopy_value = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    site = relationship("Site", back_populates="metrics")
