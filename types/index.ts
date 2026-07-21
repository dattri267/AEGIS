export type Severity = "good" | "moderate" | "high" | "severe";

export interface ZoneSummary {
  id: number;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  severity: Severity;
  severity_color: string;
  trend: number; // % change vs 6h ago, positive = worsening
}

export interface AttributionBreakdown {
  traffic_pct: number;
  construction_pct: number;
  industry_pct: number;
  dominant_causes: string[];
  confidence: number;
}

export interface ForecastPoint {
  hours_ahead: number;
  aqi_low: number;
  aqi_mid: number;
  aqi_high: number;
}

export interface HistoryPoint {
  timestamp: string;
  aqi: number;
}

export interface ZoneDetail {
  id: number;
  name: string;
  lat: number;
  lon: number;
  aqi: number;
  traffic: number;
  construction: number;
  industry: number;
  wind: number;
  severity: Severity;
  severity_color: string;
  attribution: AttributionBreakdown;
  forecast: ForecastPoint[];
  history: HistoryPoint[];
}

export interface InterventionOption {
  action: string;
  cause: string;
  impact: number;
  cost: "Low" | "Moderate" | "High";
  speed_hours: number;
  friction: number;
  authority: string;
  score: number;
}

export interface Dispatch {
  id: number;
  zone_id: number;
  zone_name: string;
  created_at: string;
  interventions: string[];
  authority: string;
  original_aqi: number;
  predicted_reduction: number;
  predicted_new_aqi: number;
  status: "dispatched" | "in_progress" | "resolved";
  resolved_at: string | null;
  actual_new_aqi: number | null;
  actual_reduction: number | null;
}

export interface Scorecard {
  total_dispatches: number;
  resolved_dispatches: number;
  avg_predicted_reduction: number;
  avg_actual_reduction: number;
  prediction_accuracy_pct: number;
  by_dispatch: Dispatch[];
}
