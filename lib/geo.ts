import type { ZoneSummary } from "@/types";

/** Simple equirectangular projection scaled to fill a padded viewBox. Fine at city scale. */
export function projectZones(zones: ZoneSummary[], width: number, height: number, padding = 60) {
  if (zones.length === 0) return new Map<number, { x: number; y: number }>();

  const lats = zones.map((z) => z.lat);
  const lons = zones.map((z) => z.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 0.01;
  const lonRange = maxLon - minLon || 0.01;

  const map = new Map<number, { x: number; y: number }>();
  for (const z of zones) {
    const x = padding + ((z.lon - minLon) / lonRange) * (width - padding * 2);
    // Invert y: higher latitude = further north = smaller y on screen
    const y = padding + (1 - (z.lat - minLat) / latRange) * (height - padding * 2);
    map.set(z.id, { x, y });
  }
  return map;
}
