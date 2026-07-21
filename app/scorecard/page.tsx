"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { Scorecard } from "@/types";
import { api, ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ScorecardPage() {
  const [data, setData] = useState<Scorecard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getScorecard().then(setData).catch((e) => setError(e instanceof ApiError ? e.message : "Failed to load."));
  }, []);

  const resolved = data?.by_dispatch.filter((d) => d.status === "resolved") || [];
  const chartData = resolved.map((d) => ({
    name: d.zone_name.split(" - ")[1] || d.zone_name,
    predicted: d.predicted_reduction,
    actual: d.actual_reduction || 0,
  }));

  return (
    <div className="min-h-screen bg-bg-0 px-6 py-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/command" className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft size={15} /> Back to command center
        </Link>
        <h1 className="mb-1 font-display text-xl font-semibold">Model scorecard</h1>
        <p className="mb-5 text-sm text-text-secondary">
          Predicted vs. actual outcome for every resolved dispatch — this is what separates Aegis from a calculator: it learns from what actually happened.
        </p>

        {error && <div className="rounded-lg border border-severe/30 bg-severe/10 p-3 text-sm text-severe">{error}</div>}
        {!data && !error && <Skeleton className="h-64 w-full" />}

        {data && (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total dispatches" value={data.total_dispatches} />
              <StatCard label="Resolved" value={data.resolved_dispatches} />
              <StatCard label="Avg predicted Δ" value={`−${data.avg_predicted_reduction}`} />
              <StatCard label="Prediction accuracy" value={`${data.prediction_accuracy_pct}%`} accent />
            </div>

            {chartData.length > 0 ? (
              <div className="h-72 rounded-xl border border-border bg-bg-1 p-4">
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: "var(--bg-2)", border: "1px solid var(--border-strong)", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="predicted" name="Predicted Δ" fill="var(--signal)" radius={4} opacity={0.5} />
                    <Bar dataKey="actual" name="Actual Δ" fill="var(--good)" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-lg bg-bg-1 p-6 text-center text-sm text-text-secondary">
                No resolved dispatches yet. Resolve one from the dispatch log to populate the scorecard.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-bg-1 p-3">
      <div className="text-xs text-text-secondary">{label}</div>
      <div className={`mt-1 font-mono text-xl font-semibold ${accent ? "text-good" : ""}`}>{value}</div>
    </div>
  );
}
