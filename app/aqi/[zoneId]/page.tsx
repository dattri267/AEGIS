"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Wind } from "lucide-react";
import type { ZoneDetail, Dispatch } from "@/types";
import { api, ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

const ADVICE: Record<string, string> = {
  good: "Air quality is safe for outdoor activity.",
  moderate: "Sensitive groups should limit prolonged outdoor exertion.",
  high: "Wear a mask outdoors, especially after sunset.",
  severe: "Avoid outdoor activity where possible and keep windows closed.",
};

export default function CitizenView() {
  const params = useParams<{ zoneId: string }>();
  const zoneId = Number(params.zoneId);
  const [zone, setZone] = useState<ZoneDetail | null>(null);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!zoneId) return;
    api.getZone(zoneId).then(setZone).catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load."));
    api.listDispatches().then((r) => setDispatches(r.dispatches.filter((d) => d.zone_id === zoneId).slice(0, 1)));
  }, [zoneId]);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-signal">
          <Wind size={13} className="text-bg-0" strokeWidth={2.5} />
        </div>
        <span className="font-display text-sm font-semibold">Aegis</span>
      </div>

      {error && <div className="rounded-lg border border-severe/30 bg-severe/10 p-4 text-sm text-severe">{error}</div>}
      {!zone && !error && <Skeleton className="h-64 w-full" />}

      {zone && (
        <>
          <div className="text-sm text-text-secondary">{zone.name.split(" - ")[1] || zone.name}</div>
          <div className="my-4 font-mono text-7xl font-semibold" style={{ color: zone.severity_color }}>
            {Math.round(zone.aqi)}
          </div>
          <div className="mb-6 text-lg font-medium">{ADVICE[zone.severity]}</div>

          <div className="w-full rounded-2xl border border-border bg-bg-1 p-4 text-left">
            <div className="mb-1 text-xs font-medium text-text-secondary">What&apos;s being done</div>
            {dispatches.length > 0 ? (
              <div className="text-sm">
                {dispatches[0].interventions.join(" + ")} was dispatched to {dispatches[0].authority}, status:{" "}
                <span className="font-medium">{dispatches[0].status}</span>.
              </div>
            ) : (
              <div className="text-sm text-text-secondary">No active response dispatched for this zone right now.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
