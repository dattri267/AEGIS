"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { ZoneSummary } from "@/types";
import { useAegisUI } from "@/lib/store";

export function AttentionQueue({ zones }: { zones: ZoneSummary[] }) {
  const openZone = useAegisUI((s) => s.openZone);
  const selectedZoneId = useAegisUI((s) => s.selectedZoneId);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-bg-1">
      <div className="border-b border-border px-4 py-3">
        <div className="font-mono text-[11px] tracking-wider text-signal">ATTENTION QUEUE</div>
        <div className="mt-0.5 text-xs text-text-secondary">Ranked by severity × trend, not alphabetically</div>
      </div>
      <div className="flex-1 divide-y divide-border overflow-y-auto">
        {zones.map((z, i) => {
          const worsening = z.trend > 0;
          return (
            <button
              key={z.id}
              onClick={() => openZone(z.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-2 ${
                selectedZoneId === z.id ? "bg-bg-2" : ""
              }`}
            >
              <span className="font-mono text-xs text-text-muted w-4">{i + 1}</span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: z.severity_color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">{z.name}</div>
                <div className="font-mono text-[11px] text-text-secondary">AQI {Math.round(z.aqi)}</div>
              </div>
              <div className={`flex items-center gap-1 font-mono text-xs ${worsening ? "text-severe" : "text-good"}`}>
                {worsening ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {Math.abs(z.trend).toFixed(1)}%
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
