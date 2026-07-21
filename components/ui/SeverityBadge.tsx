import type { Severity } from "@/types";

const LABELS: Record<Severity, string> = {
  good: "Good",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
};

const COLORS: Record<Severity, string> = {
  good: "var(--good)",
  moderate: "var(--moderate)",
  high: "var(--high)",
  severe: "var(--severe)",
};

export function SeverityBadge({ severity, aqi }: { severity: Severity; aqi?: number }) {
  const color = COLORS[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold font-mono"
      style={{ background: `${color}1a`, color, border: `1px solid ${color}40` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {aqi !== undefined ? `AQI ${Math.round(aqi)}` : LABELS[severity]}
      {aqi !== undefined ? ` · ${LABELS[severity]}` : ""}
    </span>
  );
}
