from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ZoneSummary(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    aqi: float
    severity: str
    severity_color: str
    trend: float  # % change vs 6h ago, positive = worsening

    class Config:
        from_attributes = True


class AttributionBreakdown(BaseModel):
    traffic_pct: int
    construction_pct: int
    industry_pct: int
    dominant_causes: list[str]
    confidence: int  # 0-100, derived from how dominant the top cause is


class ForecastPoint(BaseModel):
    hours_ahead: int
    aqi_low: float
    aqi_mid: float
    aqi_high: float


class HistoryPoint(BaseModel):
    timestamp: datetime
    aqi: float


class ZoneDetail(BaseModel):
    id: int
    name: str
    lat: float
    lon: float
    aqi: float
    traffic: float
    construction: float
    industry: float
    wind: float
    severity: str
    severity_color: str
    attribution: AttributionBreakdown
    forecast: list[ForecastPoint]
    history: list[HistoryPoint]


class InterventionOption(BaseModel):
    action: str
    cause: str
    impact: int        # projected AQI point reduction
    cost: str           # Low / Moderate / High
    speed_hours: int    # time to effect
    friction: int        # 0-100, political/logistical resistance
    authority: str
    score: float         # ranking score (impact per unit friction+cost)


class DispatchCreate(BaseModel):
    zone_id: int
    interventions: list[str]


class DispatchOut(BaseModel):
    id: int
    zone_id: int
    zone_name: str
    created_at: datetime
    interventions: list[str]
    authority: str
    original_aqi: float
    predicted_reduction: float
    predicted_new_aqi: float
    status: str
    resolved_at: Optional[datetime] = None
    actual_new_aqi: Optional[float] = None
    actual_reduction: Optional[float] = None

    class Config:
        from_attributes = True


class ScorecardSummary(BaseModel):
    total_dispatches: int
    resolved_dispatches: int
    avg_predicted_reduction: float
    avg_actual_reduction: float
    prediction_accuracy_pct: float
    by_dispatch: list[DispatchOut]
