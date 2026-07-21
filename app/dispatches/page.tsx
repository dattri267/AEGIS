"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, Search } from "lucide-react";
import type { Dispatch } from "@/types";
import { api, ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DispatchLogPage() {
  const [dispatches, setDispatches] = useState<Dispatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "dispatched" | "resolved">("all");
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  function load() {
    api.listDispatches().then((r) => setDispatches(r.dispatches)).catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load."));
  }
  useEffect(load, []);

  async function resolve(id: number) {
    setResolvingId(id);
    try {
      await api.resolveDispatch(id);
      load();
    } finally {
      setResolvingId(null);
    }
  }

  const filtered = (dispatches || []).filter((d) => {
    const matchesQuery = d.zone_name.toLowerCase().includes(query.toLowerCase()) || d.interventions.some((i) => i.toLowerCase().includes(query.toLowerCase()));
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-bg-0 px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/command" className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft size={15} /> Back to command center
        </Link>
        <h1 className="mb-1 font-display text-xl font-semibold">Dispatch log</h1>
        <p className="mb-5 text-sm text-text-secondary">Every intervention sent, with predicted vs. actual outcome once resolved.</p>

        <div className="mb-4 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-bg-1 px-3 py-2">
            <Search size={14} className="text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search zone or intervention…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-text-muted"
            />
          </div>
          {(["all", "dispatched", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-2 text-xs capitalize transition-colors ${
                statusFilter === s ? "border-signal/50 bg-signal-dim text-signal" : "border-border text-text-secondary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="rounded-lg border border-severe/30 bg-severe/10 p-3 text-sm text-severe">{error}</div>}
        {!dispatches && !error && <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>}

        <div className="space-y-2">
          {filtered.map((d) => (
            <div key={d.id} className="rounded-xl border border-border bg-bg-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{d.zone_name}</div>
                  <div className="mt-0.5 text-xs text-text-secondary">{d.interventions.join(" + ")}</div>
                  <div className="mt-1 font-mono text-[11px] text-text-muted">{new Date(d.created_at).toLocaleString()} · {d.authority}</div>
                </div>
                <StatusPill status={d.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 font-mono text-xs sm:grid-cols-4">
                <Metric label="Original" value={Math.round(d.original_aqi)} />
                <Metric label="Predicted" value={Math.round(d.predicted_new_aqi)} />
                <Metric label="Actual" value={d.actual_new_aqi !== null ? Math.round(d.actual_new_aqi) : "—"} />
                <Metric label="Δ predicted" value={`−${Math.round(d.predicted_reduction)}`} accent="good" />
              </div>
              {d.status !== "resolved" && (
                <button
                  onClick={() => resolve(d.id)}
                  disabled={resolvingId === d.id}
                  className="mt-3 rounded-md border border-border-strong px-3 py-1.5 text-xs hover:bg-bg-2 disabled:opacity-50"
                >
                  {resolvingId === d.id ? "Resolving…" : "Simulate outcome measurement"}
                </button>
              )}
            </div>
          ))}
          {dispatches && filtered.length === 0 && (
            <div className="rounded-lg bg-bg-1 p-6 text-center text-sm text-text-secondary">No dispatches match those filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const resolved = status === "resolved";
  return (
    <span className={`flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] ${resolved ? "bg-good/15 text-good" : "bg-moderate/15 text-moderate"}`}>
      {resolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
      {status}
    </span>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: "good" }) {
  return (
    <div className="rounded-md bg-bg-2 p-2">
      <div className="text-[10px] text-text-secondary">{label}</div>
      <div className={accent ? "text-good" : ""}>{value}</div>
    </div>
  );
}
