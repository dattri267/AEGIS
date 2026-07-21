"use client";

import { useEffect, useState } from "react";
import { X, Zap } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { ZoneDetail } from "@/types";
import { api, ApiError } from "@/lib/api";
import { useAegisUI } from "@/lib/store";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { InterventionWorkspace } from "@/components/intervention/InterventionWorkspace";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "forecast", label: "Forecast" },
  { id: "attribution", label: "Attribution" },
  { id: "history", label: "History" },
] as const;

export function ZoneDrawer() {
  const { drawerOpen, selectedZoneId, closeDrawer, activeTab, setTab, workspaceOpen, openWorkspace } = useAegisUI();
  const [zone, setZone] = useState<ZoneDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!drawerOpen || selectedZoneId === null) return;
    setLoading(true);
    setError(null);
    setZone(null);
    api.getZone(selectedZoneId)
      .then(setZone)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Something went wrong loading this zone."))
      .finally(() => setLoading(false));
  }, [drawerOpen, selectedZoneId]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/40" onClick={closeDrawer} />
      <div className="animate-drawer-in flex h-full w-full max-w-lg flex-col border-l border-border-strong bg-bg-1 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="truncate font-display text-base font-semibold">{zone?.name || "Loading zone…"}</div>
            {zone && (
              <div className="mt-1">
                <SeverityBadge severity={zone.severity} aqi={zone.aqi} />
              </div>
            )}
          </div>
          <button onClick={closeDrawer} aria-label="Close" className="rounded-md p-1.5 text-text-secondary hover:bg-bg-2 hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-severe/30 bg-severe/10 p-3 text-sm text-severe">{error}</div>
        )}

        {loading && (
          <div className="space-y-3 p-5">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {zone && !loading && (
          <>
            <div className="flex border-b border-border px-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2.5 font-mono text-xs tracking-wide transition-colors ${
                    activeTab === t.id ? "border-b-2 border-signal text-signal" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === "overview" && <OverviewTab zone={zone} />}
              {activeTab === "forecast" && <ForecastTab zone={zone} />}
              {activeTab === "attribution" && <AttributionTab zone={zone} />}
              {activeTab === "history" && <HistoryTab zone={zone} />}
            </div>

            <div className="border-t border-border p-4">
              <button
                onClick={openWorkspace}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal py-2.5 text-sm font-semibold text-bg-0 transition-transform active:scale-[0.98]"
              >
                <Zap size={15} /> What should we do here?
              </button>
            </div>
          </>
        )}
      </div>

      {workspaceOpen && zone && <InterventionWorkspace zone={zone} />}
    </div>
  );
}

function OverviewTab({ zone }: { zone: ZoneDetail }) {
  const metrics = [
    { label: "Traffic index", value: zone.traffic },
    { label: "Construction index", value: zone.construction },
    { label: "Industry index", value: zone.industry },
    { label: "Wind speed", value: `${zone.wind} km/h` },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg bg-bg-2 p-3">
            <div className="text-xs text-text-secondary">{m.label}</div>
            <div className="mt-1 font-mono text-lg font-semibold">{m.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-signal/25 bg-signal-dim p-3 text-sm leading-relaxed">
        Primary drivers: <strong>{zone.attribution.dominant_causes.join(", ")}</strong> ·{" "}
        <span className="text-text-secondary">model confidence {zone.attribution.confidence}%</span>
      </div>
    </div>
  );
}

function ForecastTab({ zone }: { zone: ZoneDetail }) {
  const data = zone.forecast.map((f) => ({ h: `${f.hours_ahead}h`, low: f.aqi_low, mid: f.aqi_mid, high: f.aqi_high }));
  return (
    <div>
      <div className="mb-3 text-xs text-text-secondary">
        Projected AQI with widening confidence band — uncertainty grows honestly with distance, unlike a flat point estimate.
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="h" stroke="var(--text-muted)" fontSize={11} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--bg-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="high" stroke="none" fill="var(--signal)" fillOpacity={0.08} />
            <Area type="monotone" dataKey="low" stroke="none" fill="var(--bg-1)" fillOpacity={1} />
            <Line type="monotone" dataKey="mid" stroke="var(--signal)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AttributionTab({ zone }: { zone: ZoneDetail }) {
  const rows = [
    { label: "Traffic", pct: zone.attribution.traffic_pct, color: "var(--signal)" },
    { label: "Construction", pct: zone.attribution.construction_pct, color: "var(--high)" },
    { label: "Industry", pct: zone.attribution.industry_pct, color: "var(--moderate)" },
  ];
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="font-mono text-text-secondary">{r.pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-bg-2">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, background: r.color }} />
          </div>
        </div>
      ))}
      <div className="pt-2 text-xs text-text-secondary">
        Confidence {zone.attribution.confidence}% — reflects how clearly the leading cause separates from the runner-up.
      </div>
    </div>
  );
}

function HistoryTab({ zone }: { zone: ZoneDetail }) {
  const data = zone.history.map((h) => ({
    t: new Date(h.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    aqi: h.aqi,
  }));
  return (
    <div className="h-64 w-full">
      <div className="mb-3 text-xs text-text-secondary">Last 30 days, hourly readings</div>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="t" stroke="var(--text-muted)" fontSize={10} interval={Math.floor(data.length / 6)} />
          <YAxis stroke="var(--text-muted)" fontSize={11} />
          <Tooltip contentStyle={{ background: "var(--bg-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey="aqi" stroke="var(--signal)" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
