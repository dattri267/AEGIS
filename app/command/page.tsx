"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wind, Bell, ListChecks, Gauge } from "lucide-react";
import type { ZoneSummary } from "@/types";
import { api, ApiError } from "@/lib/api";
import { CityMap } from "@/components/command/CityMap";
import { AttentionQueue } from "@/components/command/AttentionQueue";
import { AskAegis } from "@/components/command/AskAegis";
import { ZoneDrawer } from "@/components/drawer/ZoneDrawer";
import { Skeleton } from "@/components/ui/Skeleton";

const POLL_MS = 20000;

export default function CommandCenter() {
  const [zones, setZones] = useState<ZoneSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { zones } = await api.listZones();
        if (!cancelled) { setZones(zones); setError(null); }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Failed to load zones.");
      }
    }
    load();
    const id = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const severeCount = zones?.filter((z) => z.severity === "severe").length ?? 0;
  const avgAqi = zones && zones.length ? Math.round(zones.reduce((s, z) => s + z.aqi, 0) / zones.length) : null;

  return (
    <div className="flex h-screen flex-col bg-bg-0">
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-signal">
              <Wind size={13} className="text-bg-0" strokeWidth={2.5} />
            </div>
            <span className="font-display text-sm font-semibold">Aegis</span>
          </Link>
          <div className="hidden items-center gap-4 font-mono text-xs text-text-secondary sm:flex">
            <span className="flex items-center gap-1.5"><Gauge size={13} /> Avg AQI {avgAqi ?? "—"}</span>
            <span className="flex items-center gap-1.5 text-severe"><ListChecks size={13} /> {severeCount} zones severe</span>
          </div>
        </div>

        {zones && <AskAegis zones={zones} />}

        <div className="flex items-center gap-3">
          <Link href="/dispatches" className="text-xs text-text-secondary hover:text-text-primary">Dispatch log</Link>
          <Link href="/scorecard" className="text-xs text-text-secondary hover:text-text-primary">Scorecard</Link>
          <button aria-label="Notifications" className="rounded-md p-1.5 text-text-secondary hover:bg-bg-1 hover:text-text-primary">
            <Bell size={16} />
          </button>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-[1fr_320px] gap-4 overflow-hidden p-4">
        {error && (
          <div className="col-span-2 rounded-lg border border-severe/30 bg-severe/10 p-3 text-sm text-severe">{error}</div>
        )}
        {!zones && !error && <Skeleton className="col-span-2 h-full w-full" />}
        {zones && (
          <>
            <CityMap zones={zones} />
            <AttentionQueue zones={zones} />
          </>
        )}
      </main>

      <ZoneDrawer />
    </div>
  );
}
