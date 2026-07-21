from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)

    # Latest snapshot values — the "readings" table holds history for charts
    aqi = Column(Float, nullable=False)
    traffic = Column(Float, nullable=False)
    construction = Column(Float, nullable=False)
    industry = Column(Float, nullable=False)
    wind = Column(Float, nullable=False)

    readings = relationship("Reading", back_populates="zone", cascade="all, delete-orphan")
    dispatches = relationship("Dispatch", back_populates="zone", cascade="all, delete-orphan")


class Reading(Base):
    """Hourly synthetic history — powers trend sparklines and forecast charts."""
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    aqi = Column(Float, nullable=False)
    traffic = Column(Float, nullable=False)
    construction = Column(Float, nullable=False)
    industry = Column(Float, nullable=False)
    wind = Column(Float, nullable=False)

    zone = relationship("Zone", back_populates="readings")


class Dispatch(Base):
    """
    A dispatched intervention (or set of interventions) for a zone.
    Tracks the model's predicted effect vs. what actually happened —
    this is the outcome-feedback loop the product is built around.
    """
    __tablename__ = "dispatches"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    interventions = Column(JSON, nullable=False)          # list[str] of intervention names
    authority = Column(String, nullable=False)

    original_aqi = Column(Float, nullable=False)
    predicted_reduction = Column(Float, nullable=False)
    predicted_new_aqi = Column(Float, nullable=False)

    status = Column(String, default="dispatched", nullable=False)  # dispatched | in_progress | resolved
    resolved_at = Column(DateTime, nullable=True)
    actual_new_aqi = Column(Float, nullable=True)
    actual_reduction = Column(Float, nullable=True)

    zone = relationship("Zone", back_populates="dispatches")
