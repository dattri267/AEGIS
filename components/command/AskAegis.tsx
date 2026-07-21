"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Sparkles, CornerDownLeft } from "lucide-react";
import type { ZoneSummary } from "@/types";
import { askAegis } from "@/lib/askAegis";

const SUGGESTIONS = [
  "Which zone is most polluted?",
  "Compare Zone A and Zone B",
  "What will happen in 6 hours?",
  "Recommend an intervention",
];

export function AskAegis({ zones }: { zones: ZoneSummary[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  async function submit(q: string) {
    setLoading(true);
    setAnswer(null);
    try {
      const result = await askAegis(q, zones);
      setAnswer(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full max-w-md items-center gap-2 rounded-lg border border-border bg-bg-1 px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:border-border-strong"
      >
        <Search size={15} />
        <span className="flex-1">Ask Aegis anything…</span>
        <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-scale-in w-full max-w-xl rounded-2xl border border-border-strong bg-bg-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Sparkles size={16} className="text-signal" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) submit(query); }}
                placeholder="Ask about a zone, comparison, forecast, or action…"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <kbd className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                <CornerDownLeft size={10} /> enter
              </kbd>
            </div>

            <div className="max-h-96 overflow-y-auto p-4">
              {loading && <div className="text-sm text-text-secondary">Analyzing live zone data…</div>}
              {answer && !loading && (
                <div className="animate-aegis-rise rounded-lg border border-signal/25 bg-signal-dim p-3 text-sm leading-relaxed text-text-primary">
                  {answer}
                </div>
              )}
              {!answer && !loading && (
                <div className="space-y-1.5">
                  <div className="mb-2 font-mono text-[11px] tracking-wide text-text-muted">TRY ASKING</div>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s); submit(s); }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-bg-2 hover:text-text-primary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
