"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Wind, Radar, Zap, ChevronRight, MapPin } from "lucide-react";
import type { ZoneSummary } from "@/types";
import { api } from "@/lib/api";
import { projectZones } from "@/lib/geo";

function useCountUp(target: number, duration = 1400, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    let t0: number | null = null;
    const step = (t: number) => {
      if (t0 === null) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return val;
}

function AtmosphereWaveform({ height = 56 }: { height?: number }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSeed((s) => s + 1), 2200);
    return () => clearInterval(id);
  }, []);
  const w = 800;
  const points = Array.from({ length: 40 }, (_, i) => Math.sin(i / 3.2 + seed * 0.4) * 0.5 + Math.sin(i / 7 + seed) * 0.3);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i / (points.length - 1)) * w} ${height / 2 - p * (height / 2 - 6)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="var(--signal)" strokeWidth={1.5} opacity={0.9} style={{ transition: "d 2s cubic-bezier(.4,0,.2,1)" }} />
      <path d={path} fill="none" stroke="var(--signal)" strokeWidth={8} opacity={0.06} style={{ transition: "d 2s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function MiniCityPreview({ zones }: { zones: ZoneSummary[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 400, H = 250;
  const positions = projectZones(zones, W, H, 30);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-bg-1" style={{ aspectRatio: "16/10" }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {zones.map((z) => {
          const pos = positions.get(z.id);
          if (!pos) return null;
          const isHovered = hovered === z.id;
          return (
            <g key={z.id} transform={`translate(${pos.x}, ${pos.y})`}
               onMouseEnter={() => setHovered(z.id)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
              {z.severity === "severe" && <circle r={18} fill={z.severity_color} opacity={0.18} className="animate-aegis-pulse" />}
              <circle r={isHovered ? 11 : 8} fill={z.severity_color} style={{ transition: "r .2s ease" }} />
              {isHovered && (
                <g transform="translate(0, -30)">
                  <rect x={-58} y={-14} width={116} height={24} rx={6} fill="var(--bg-2)" stroke="var(--border-strong)" />
                  <text x={0} y={3} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--text-primary)">
                    {z.name.split(" - ")[1] || z.name} · {Math.round(z.aqi)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute left-3 top-3 font-mono text-[10px] tracking-wide text-text-secondary">LIVE · DELHI NCR</div>
    </div>
  );
}

function MetricCard({ label, value, suffix = "", decimals = 0, active }: { label: string; value: number; suffix?: string; decimals?: number; active: boolean }) {
  const n = useCountUp(value, 1400, active);
  return (
    <div className="rounded-xl border border-border bg-bg-1 px-5 py-4">
      <div className="mb-2 text-xs text-text-secondary">{label}</div>
      <div className="font-mono text-2xl font-semibold">{n.toFixed(decimals)}{suffix}</div>
    </div>
  );
}

export default function LandingPage() {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [metricsVisible, setMetricsVisible] = useState(false);
  const metricsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.listZones().then((r) => setZones(r.zones)).catch(() => {});
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setMetricsVisible(true); }, { threshold: 0.4 });
    if (metricsRef.current) obs.observe(metricsRef.current);
    return () => obs.disconnect();
  }, []);

  const firstZoneId = zones[0]?.id ?? 1;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg-0/85 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-signal">
            <Wind size={13} className="text-bg-0" strokeWidth={2.5} />
          </div>
          <span className="font-display text-base font-semibold">Aegis</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden text-sm text-text-secondary sm:inline">Product</span>
          <span className="hidden text-sm text-text-secondary sm:inline">For cities</span>
          <Link href={`/aqi/${firstZoneId}`} className="hidden text-sm text-text-secondary hover:text-text-primary sm:inline">Check your air</Link>
          <Link href="/command" className="rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-bg-0">
            Open command center
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 pb-8 pt-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="animate-aegis-rise">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs" style={{ color: "var(--signal)", background: "var(--signal-dim)", borderColor: "rgba(76,142,255,0.25)" }}>
              <Radar size={13} /> Operations copilot for air quality
            </div>
            <h1 className="mb-5 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Know what&apos;s causing it.<br />Know what to do about it.
            </h1>
            <p className="mb-8 max-w-md text-base leading-relaxed text-text-secondary">
              Aegis turns raw sensor, traffic, and industrial data into ranked interventions —
              then tracks whether they actually worked, and gets sharper every time.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/command" className="flex items-center gap-2 rounded-lg bg-signal px-5 py-3 text-sm font-semibold text-bg-0">
                Open command center <ArrowRight size={16} />
              </Link>
              <Link href={`/aqi/${firstZoneId}`} className="flex items-center gap-2 rounded-lg border border-border-strong px-5 py-3 text-sm font-medium">
                Check your air <ChevronRight size={15} />
              </Link>
            </div>
          </div>
          <div className="animate-aegis-rise" style={{ animationDelay: "0.1s" }}>
            <MiniCityPreview zones={zones} />
          </div>
        </div>

        <div className="mt-14 border-y border-border py-2">
          <AtmosphereWaveform />
        </div>
      </section>

      <section ref={metricsRef} className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetricCard label="Zones monitored" value={128} active={metricsVisible} />
          <MetricCard label="Avg. response time" value={11.4} suffix=" min" decimals={1} active={metricsVisible} />
          <MetricCard label="Prediction accuracy" value={87} suffix="%" active={metricsVisible} />
          <MetricCard label="Interventions tracked" value={946} active={metricsVisible} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-8">
        <div className="mb-10">
          <div className="mb-2 font-mono text-xs tracking-widest text-signal">THE LOOP</div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Predict. Decide. Act. Learn.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { icon: Radar, title: "Predict", body: "Live attribution and short-horizon forecasts, with honest confidence bands — not fixed multipliers." },
            { icon: Zap, title: "Decide & act", body: "Ranked interventions with real tradeoffs. Dispatch to the owning authority in one action." },
            { icon: MapPin, title: "Learn", body: "Every dispatch is compared against its predicted effect. The model recalibrates from real outcomes." },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-bg-1 p-6">
              <c.icon size={20} className="mb-3.5 text-signal" />
              <div className="mb-2 text-base font-semibold">{c.title}</div>
              <div className="text-sm leading-relaxed text-text-secondary">{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-6 text-xs text-text-muted">
        Aegis — air quality operations layer
      </footer>
    </div>
  );
}
