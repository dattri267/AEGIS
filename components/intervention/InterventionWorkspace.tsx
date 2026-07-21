"use client";

import { useEffect, useMemo, useState } from "react";
import { X, ArrowUpDown, Check, Send, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { InterventionOption, ZoneDetail, Dispatch } from "@/types";
import { api, ApiError } from "@/lib/api";
import { useAegisUI } from "@/lib/store";
import { Skeleton } from "@/components/ui/Skeleton";

type SortKey = "score" | "impact" | "cost" | "speed_hours" | "friction";
const COST_RANK = { Low: 1, Moderate: 2, High: 3 };

export function InterventionWorkspace({ zone }: { zone: ZoneDetail }) {
  const closeWorkspace = useAegisUI((s) => s.closeWorkspace);
  const [options, setOptions] = useState<InterventionOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<Dispatch | null>(null);

  useEffect(() => {
    api.getInterventions(zone.id)
      .then((r) => setOptions(r.interventions))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Could not load interventions."));
  }, [zone.id]);

  const sorted = useMemo(() => {
    if (!options) return [];
    const copy = [...options];
    copy.sort((a, b) => {
      if (sortKey === "cost") return COST_RANK[a.cost] - COST_RANK[b.cost];
      if (sortKey === "friction") return a.friction - b.friction;
      return (b[sortKey] as number) - (a[sortKey] as number);
    });
    return copy;
  }, [options, sortKey]);

  const projectedReduction = useMemo(() => {
    if (!options) return 0;
    return options.filter((o) => selected.has(o.action)).reduce((s, o) => s + o.impact, 0);
  }, [options, selected]);

  const chartData = [
    { label: "Current", aqi: zone.aqi },
    { label: "Projected", aqi: Math.max(35, zone.aqi - projectedReduction) },
  ];

  function toggle(action: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  }

  async function dispatch() {
    setDispatching(true);
    setError(null);
    try {
      const result = await api.createDispatch(zone.id, Array.from(selected));
      setDispatchResult(result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="animate-scale-in flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-bg-1 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="font-display text-base font-semibold">Intervention workspace</div>
            <div className="text-xs text-text-secondary">{zone.name} · current AQI {Math.round(zone.aqi)}</div>
          </div>
          <button onClick={closeWorkspace} aria-label="Close" className="rounded-md p-1.5 text-text-secondary hover:bg-bg-2 hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {dispatchResult ? (
          <DispatchConfirmation dispatch={dispatchResult} onClose={closeWorkspace} />
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {error && <div className="mb-4 rounded-lg border border-severe/30 bg-severe/10 p-3 text-sm text-severe">{error}</div>}

            {!options && !error && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )}

            {options && (
              <>
                <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="shrink-0 text-xs text-text-secondary">Sort by</span>
                  {(["score", "impact", "cost", "speed_hours", "friction"] as SortKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => setSortKey(k)}
                      className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        sortKey === k ? "border-signal/50 bg-signal-dim text-signal" : "border-border text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      <ArrowUpDown size={11} />
                      {k === "speed_hours" ? "speed" : k}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {sorted.map((o) => {
                    const isSelected = selected.has(o.action);
                    return (
                      <button
                        key={o.action}
                        onClick={() => toggle(o.action)}
                        className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                          isSelected ? "border-signal/60 bg-signal-dim" : "border-border bg-bg-2 hover:border-border-strong"
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            isSelected ? "border-signal bg-signal text-bg-0" : "border-border-strong"
                          }`}
                        >
                          {isSelected && <Check size={13} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{o.action}</div>
                          <div className="mt-0.5 text-xs text-text-secondary">{o.authority}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px]">
                            <Tag>−{o.impact} AQI</Tag>
                            <Tag>{o.cost} cost</Tag>
                            <Tag>{o.speed_hours}h to effect</Tag>
                            <Tag>{o.friction}% friction</Tag>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {sorted.length === 0 && (
                    <div className="rounded-lg bg-bg-2 p-4 text-sm text-text-secondary">
                      No cause in this zone is dominant enough to recommend a targeted action right now.
                    </div>
                  )}
                </div>

                {selected.size > 0 && (
                  <div className="animate-aegis-rise mt-5 rounded-xl border border-border bg-bg-2 p-4">
                    <div className="mb-2 text-xs font-medium text-text-secondary">Simulated impact</div>
                    <div className="h-32 w-full">
                      <ResponsiveContainer>
                        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                          <XAxis type="number" stroke="var(--text-muted)" fontSize={11} domain={[0, "dataMax + 40"]} />
                          <YAxis type="category" dataKey="label" stroke="var(--text-muted)" fontSize={12} width={70} />
                          <Tooltip contentStyle={{ background: "var(--bg-1)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }} />
                          <Bar dataKey="aqi" fill="var(--signal)" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-1 text-sm">
                      Projected reduction: <strong className="text-good">−{projectedReduction} AQI</strong>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {!dispatchResult && (
          <div className="border-t border-border p-4">
            <button
              disabled={selected.size === 0 || dispatching}
              onClick={dispatch}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-signal py-2.5 text-sm font-semibold text-bg-0 transition-transform disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
            >
              {dispatching ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {dispatching ? "Dispatching…" : `Dispatch ${selected.size ? `${selected.size} action${selected.size > 1 ? "s" : ""}` : ""}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded bg-bg-1 px-1.5 py-0.5 text-text-secondary">{children}</span>;
}

function DispatchConfirmation({ dispatch, onClose }: { dispatch: Dispatch; onClose: () => void }) {
  return (
    <div className="animate-aegis-rise flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-good/15 text-good">
        <Check size={26} />
      </div>
      <div>
        <div className="font-display text-lg font-semibold">Dispatched</div>
        <div className="mt-1 text-sm text-text-secondary">
          Ticket #{dispatch.id} sent to {dispatch.authority}
        </div>
      </div>
      <div className="w-full max-w-xs rounded-xl border border-border bg-bg-2 p-4 text-left text-sm">
        <div className="flex justify-between py-1">
          <span className="text-text-secondary">Predicted new AQI</span>
          <span className="font-mono">{Math.round(dispatch.predicted_new_aqi)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-text-secondary">Predicted reduction</span>
          <span className="font-mono text-good">−{Math.round(dispatch.predicted_reduction)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-text-secondary">Status</span>
          <span className="font-mono">{dispatch.status}</span>
        </div>
      </div>
      <div className="text-xs text-text-muted">
        Outcome will be tracked automatically and compared against this prediction in the Model Scorecard.
      </div>
      <button onClick={onClose} className="mt-2 rounded-lg border border-border-strong px-4 py-2 text-sm hover:bg-bg-2">
        Back to command center
      </button>
    </div>
  );
}
