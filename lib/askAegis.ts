import type { ZoneSummary } from "@/types";
import { api } from "@/lib/api";

/**
 * Rule-based "Ask Aegis" responder. Deliberately NOT an LLM call — per product
 * spec this ships with predefined-but-data-grounded answers first, and every
 * number quoted below comes from a live API call, not a canned string, so the
 * demo holds up under follow-up questions.
 */

function findZone(zones: ZoneSummary[], query: string): ZoneSummary | undefined {
  const q = query.toLowerCase();
  // "zone a", "zone b" style references
  const letterMatch = q.match(/zone\s+([a-e])\b/);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const found = zones.find((z) => z.name.toLowerCase().startsWith(`zone ${letter.toLowerCase()}`));
    if (found) return found;
  }
  // match by locality name, e.g. "rohini", "dwarka", "gurugram"
  return zones.find((z) => q.includes(z.name.split(" - ")[1]?.toLowerCase() || "___"));
}

function findTwoZones(zones: ZoneSummary[], query: string): ZoneSummary[] {
  const q = query.toLowerCase();
  const matches = zones.filter((z) => {
    const letter = z.name.match(/zone\s+([a-e])/i)?.[1]?.toLowerCase();
    const locality = z.name.split(" - ")[1]?.toLowerCase();
    return (letter && q.includes(`zone ${letter}`)) || (locality && q.includes(locality));
  });
  return matches.slice(0, 2);
}

export async function askAegis(query: string, zones: ZoneSummary[]): Promise<string> {
  const q = query.toLowerCase().trim();

  if (!q) return "Ask about a zone, a comparison, a forecast, or a recommended action.";

  // "most polluted zone" / "worst zone"
  if (/(most polluted|worst|highest aqi|dirtiest)/.test(q)) {
    const worst = [...zones].sort((a, b) => b.aqi - a.aqi)[0];
    return `${worst.name} is currently the most polluted zone at AQI ${Math.round(worst.aqi)} (${worst.severity}), ${
      worst.trend > 0 ? `trending up ${worst.trend.toFixed(1)}% over the last 6 hours` : `down ${Math.abs(worst.trend).toFixed(1)}% over the last 6 hours`
    }.`;
  }

  // "compare zone a and b"
  if (/compare/.test(q)) {
    const pair = findTwoZones(zones, q);
    if (pair.length === 2) {
      const [a, b] = pair;
      const detailA = await api.getZone(a.id);
      const detailB = await api.getZone(b.id);
      return `${a.name}: AQI ${Math.round(a.aqi)}, driven mainly by ${detailA.attribution.dominant_causes.join(", ")} (${detailA.attribution.traffic_pct}% traffic). ${b.name}: AQI ${Math.round(
        b.aqi
      )}, driven mainly by ${detailB.attribution.dominant_causes.join(", ")} (${detailB.attribution.traffic_pct}% traffic). ${
        a.aqi > b.aqi ? a.name : b.name
      } needs attention first.`;
    }
    return "Name two zones to compare, for example \"compare Zone A and Zone B\".";
  }

  // forecast-style question: "what will happen in 6 hours" / "what happens next"
  if (/(what will happen|forecast|next \d+ hours?|in \d+ hours?)/.test(q)) {
    const zone = findZone(zones, q) || [...zones].sort((a, b) => b.aqi - a.aqi)[0];
    const detail = await api.getZone(zone.id);
    const hourMatch = q.match(/(\d+)\s*hours?/);
    const targetHours = hourMatch ? parseInt(hourMatch[1], 10) : 6;
    const point = detail.forecast.reduce((closest, p) =>
      Math.abs(p.hours_ahead - targetHours) < Math.abs(closest.hours_ahead - targetHours) ? p : closest
    );
    return `${zone.name} is projected to reach AQI ${Math.round(point.aqi_mid)} in ${point.hours_ahead}h (range ${Math.round(
      point.aqi_low
    )}–${Math.round(point.aqi_high)}, widening with distance as expected). Primary driver: ${detail.attribution.dominant_causes.join(", ")}.`;
  }

  // recommend intervention
  if (/(recommend|what should we do|intervention|action)/.test(q)) {
    const zone = findZone(zones, q) || [...zones].sort((a, b) => b.aqi - a.aqi)[0];
    const { interventions } = await api.getInterventions(zone.id);
    if (interventions.length === 0) return `${zone.name} doesn't have a dominant enough cause to recommend a targeted action right now.`;
    const top = interventions[0];
    return `For ${zone.name}, the top-ranked action is "${top.action}" — projected −${top.impact} AQI, ${top.cost.toLowerCase()} cost, effective within ${top.speed_hours}h, via ${top.authority}. ${
      interventions.length > 1 ? `Runner-up: "${interventions[1].action}" (−${interventions[1].impact} AQI).` : ""
    }`;
  }

  // city-wide status fallback
  const severeCount = zones.filter((z) => z.severity === "severe").length;
  const avg = zones.reduce((s, z) => s + z.aqi, 0) / zones.length;
  return `Right now ${severeCount} of ${zones.length} zones are in severe range, average AQI ${Math.round(
    avg
  )}. Try asking "which zone is most polluted", "compare Zone A and Zone B", "what will happen in 6 hours", or "recommend an intervention".`;
}
