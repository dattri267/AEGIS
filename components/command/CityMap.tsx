"use client";

import { useMemo, useState } from "react";
import type { ZoneSummary } from "@/types";
import { projectZones } from "@/lib/geo";
import { useAegisUI } from "@/lib/store";

const W = 900;
const H = 640;

export function CityMap({ zones }: { zones: ZoneSummary[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const openZone = useAegisUI((s) => s.openZone);
  const selectedZoneId = useAegisUI((s) => s.selectedZoneId);
  const positions = useMemo(() => projectZones(zones, W, H), [zones]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-bg-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />

        {zones.map((z) => {
          const pos = positions.get(z.id);
          if (!pos) return null;
          const isHovered = hoveredId === z.id;
          const isSelected = selectedZoneId === z.id;
          const radius = isSelected ? 26 : isHovered ? 22 : 16;
          return (
            <g
              key={z.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onMouseEnter={() => setHoveredId(z.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => openZone(z.id)}
              style={{ cursor: "pointer" }}
              role="button"
              aria-label={`${z.name}, AQI ${Math.round(z.aqi)}, ${z.severity}`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") openZone(z.id); }}
            >
              {z.trend > 4 && (
                <circle r={radius + 10} fill={z.severity_color} opacity={0.18} className="animate-aegis-pulse" />
              )}
              <circle r={radius} fill={z.severity_color} opacity={isHovered || isSelected ? 0.95 : 0.75}
                style={{ transition: "r 0.2s ease, opacity 0.2s ease" }} />
              <circle r={radius} fill="none" stroke={z.severity_color} strokeWidth={isSelected ? 2.5 : 0} opacity={0.9} />

              {(isHovered || isSelected) && (
                <g transform="translate(0, -38)">
                  <rect x={-64} y={-18} width={128} height={30} rx={7} fill="var(--bg-2)" stroke="var(--border-strong)" />
                  <text x={0} y={2} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--text-primary)">
                    {z.name.split(" - ")[1] || z.name} · {Math.round(z.aqi)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-border bg-bg-2/80 px-3 py-1.5 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-good animate-aegis-pulse" />
        <span className="font-mono text-[11px] tracking-wide text-text-secondary">LIVE · DELHI NCR</span>
      </div>
    </div>
  );
}
