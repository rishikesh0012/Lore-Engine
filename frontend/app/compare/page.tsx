"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { compareSources } from "@/lib/api";
import { CompareResponse } from "@/lib/types";
import { GitCompare, CheckCircle2, AlertTriangle, Sparkles, BookOpen } from "lucide-react";

const SOURCES = [
  { id: "hesiod_theogony", name: "Hesiod's Theogony" },
  { id: "homer_iliad", name: "Homer's Iliad" },
  { id: "homer_odyssey", name: "Homer's Odyssey" },
  { id: "ovid_metamorphoses", name: "Ovid's Metamorphoses" }
];

export default function SourceComparisonPage() {
  const [sourceA, setSourceA] = useState("hesiod_theogony");
  const [sourceB, setSourceB] = useState("homer_iliad");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    compareSources(sourceA, sourceB).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [sourceA, sourceB]);

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              Source Comparison Engine
            </h1>
            <p className="text-xs text-slate-400">
              Cross-reference narrative traditions to expose agreements, structural contradictions, and unique claims.
            </p>
          </div>

          {/* Selectors */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
            <select
              value={sourceA}
              onChange={(e) => setSourceA(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none"
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <span className="text-xs font-mono text-slate-500 font-bold">VS</span>
            <select
              value={sourceB}
              onChange={(e) => setSourceB(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-violet-300 font-mono focus:outline-none"
            >
              {SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Grid */}
        {loading || !data ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-slate-900/60 rounded-2xl" />
            <div className="h-48 bg-slate-900/60 rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Contradictions (High Priority) */}
            <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-base font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Structural Narrative Contradictions ({data.contradictions.length})
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Strictly Bounded Rules Applied
                </span>
              </div>

              <div className="space-y-3">
                {data.contradictions.map((c, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/70 border border-rose-500/20 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-100 font-bold">{c.entity}</span>
                      <span className="text-rose-400">{c.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-800/60">
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5">
                        <span className="text-[10px] text-amber-400 block mb-1">Source A Claim:</span>
                        <span className="text-slate-200">{c.claim_a}</span>
                      </div>
                      <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-2.5">
                        <span className="text-[10px] text-violet-400 block mb-1">Source B Claim:</span>
                        <span className="text-slate-200">{c.claim_b}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agreements */}
            <div className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Cross-Tradition Agreements ({data.agreements.length})
              </h3>
              <div className="space-y-3">
                {data.agreements.map((a, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/70 border border-emerald-500/20 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-100 font-bold">{a.entity}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px]">
                          {a.relation}
                        </span>
                        <span className="text-slate-100 font-bold">{a.target}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Cross-Alias Match</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique Claims */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-serif text-sm font-bold text-amber-300">Unique to Source A</h4>
                {data.unique_to_a.map((u, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono">
                    {u.entity} — [{u.relation}] → {u.target}
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-serif text-sm font-bold text-violet-300">Unique to Source B</h4>
                {data.unique_to_b.map((u, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono">
                    {u.entity} — [{u.relation}] → {u.target}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
