def classify(aqi: float) -> tuple[str, str]:
    """Return (label, hex_color) for an AQI value, using a real sequential ramp
    (emerald -> amber -> orange -> rose) instead of a single alarm color."""
    if aqi <= 100:
        return "good", "#34D399"
    if aqi <= 200:
        return "moderate", "#FBBF24"
    if aqi <= 300:
        return "high", "#FB923C"
    return "severe", "#F43F5E"
