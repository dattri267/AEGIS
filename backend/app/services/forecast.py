"""
Forecast engine.

Also a clearly-labeled stub for a real short-horizon time-series model
(e.g. incorporating forward weather data). What it fixes vs. the original
prototype's `aqi + 20` / `aqi + 40`:

  1. Direction depends on wind: low wind -> pollution accumulates (AQI
     trends up); high wind -> disperses (AQI trends down). The old code
     escalated every zone by the same fixed amount regardless of wind.
  2. Confidence widens with horizon, and is shown as low/mid/high, not a
     single fake point estimate. A 12h-out forecast should visibly be
     less certain than a 1h-out one.
"""


def compute_forecast(aqi: float, wind: float, horizons=(1, 3, 6, 12)) -> list[dict]:
    # Wind factor: >18 km/h disperses, <8 km/h accumulates, in between mild drift
    drift_per_hour = (10 - wind) * 1.35  # positive when wind is low -> AQI rises

    points = []
    for h in horizons:
        mid = max(35, aqi + drift_per_hour * h * 0.6)
        # Uncertainty grows with the square root of horizon — standard for
        # compounding forecast error, and visibly honest about long-range risk.
        spread = 6 + (h ** 0.5) * 9
        points.append({
            "hours_ahead": h,
            "aqi_low": round(max(20, mid - spread), 1),
            "aqi_mid": round(mid, 1),
            "aqi_high": round(mid + spread, 1),
        })
    return points
