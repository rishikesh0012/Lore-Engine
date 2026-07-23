"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { compareSources } from "@/lib/api";
import { CompareResponse } from "@/lib/types";
import { GitCompare, CheckCircle2, AlertTriangle, Sparkles, BookOpen, Shuffle, RefreshCw, Info } from "lucide-react";

const SOURCES = [
  { id: "hesiod_theogony", name: "Hesiod's Theogony" },
  { id: "homer_iliad", name: "Homer's Iliad" },
  { id: "homer_odyssey", name: "Homer's Odyssey" },
  { id: "ovid_metamorphoses", name: "Ovid's Metamorphoses" }
];

const RANDOM_CONFLICT_PAIRS = [
  { a: "hesiod_theogony", b: "homer_iliad" },
  { a: "homer_iliad", b: "ovid_metamorphoses" },
  { a: "hesiod_theogony", b: "homer_odyssey" },
  { a: "homer_odyssey", b: "ovid_metamorphoses" },
  { a: "hesiod_theogony", b: "ovid_metamorphoses" },
  { a: "homer_iliad", b: "homer_odyssey" }
];

export default function SourceComparisonPage() {
  const [sourceA, setSourceA] = useState("hesiod_theogony");
  const [sourceB, setSourceB] = useState("homer_iliad");
  const [data, setData] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadComparison = () => {
    setLoading(true);
    setError(null);

    compareSources(sourceA, sourceB)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to compare selected sources.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadComparison();
  }, [sourceA, sourceB]);

  const handleRandomConflict = () => {
    const available = RANDOM_CONFLICT_PAIRS.filter(
      (p) => !(p.a === sourceA && p.b === sourceB) && !(p.a === sourceB && p.b === sourceA)
    );
    const chosen = available[Math.floor(Math.random() * available.length)] || RANDOM_CONFLICT_PAIRS[0];
    setSourceA(chosen.a);
    setSourceB(chosen.b);
  };

  const isSameSource = sourceA === sourceB;

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              Source Comparison Engine
            </h1>
            <p className="text-xs text-slate-400">
              Cross-reference narrative traditions to expose agreements, structural contradictions, and unique claims.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selectors */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
              <select
                value={sourceA}
                onChange={(e) => setSourceA(e.target.value)}
                aria-label="Select Source A for comparison"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
              >
                {SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span className="text-xs font-mono text-slate-500 font-bold">VS</span>
              <select
                value={sourceB}
                onChange={(e) => setSourceB(e.target.value)}
                aria-label="Select Source B for comparison"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-violet-300 font-mono focus:outline-none focus:border-violet-500"
              >
                {SOURCES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Random Conflict Trigger */}
            <button
              onClick={handleRandomConflict}
              aria-label="Load random conflict source pair"
              className="flex items-center gap-2 px-4 py-2 bg-[#7A5FB0]/20 border border-[#7A5FB0]/40 rounded-xl hover:bg-[#7A5FB0]/30 transition-all text-amber-300 text-xs font-mono font-bold shadow-md"
            >
              <Shuffle size={14} className="text-amber-400" /> Random Conflict
            </button>
          </div>
        </div>

        {/* Same Source Banner Warning */}
        {isSameSource && (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-2xl p-6 text-center space-y-2">
            <Info className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-amber-200">Identical Source Selected</h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              You selected the same manuscript for both inputs. Choose two distinct mythic texts to inspect cross-tradition agreements, line-by-line contradictions, and unique entity claims.
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && !isSameSource && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadComparison}
              className="flex items-center gap-1 px-3 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg font-mono text-[11px]"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && !isSameSource && (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            <div className="h-48 bg-slate-900/60 border border-slate-800 rounded-2xl" />
          </div>
        )}

        {/* Comparison Results */}
        {!loading && !isSameSource && data && (
          <div className="space-y-6">
            {/* Contradictions */}
            <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-base font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Structural Contradictions ({data.contradictions.length})
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Bounded Rules Evaluated
                </span>
              </div>

              {data.contradictions.length > 0 ? (
                <div className="space-y-3">
                  {data.contradictions.map((c, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/70 border border-rose-500/20 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-100 font-bold">{c.entity}</span>
                        <span className="text-rose-400">{c.type}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2 border-t border-slate-800/60">
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
              ) : (
                <div className="text-xs font-mono text-slate-400 text-center py-4">
                  No structural contradictions detected between these two sources.
                </div>
              )}
            </div>

            {/* Agreements */}
            <div className="bg-slate-900/70 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Cross-Tradition Agreements ({data.agreements.length})
              </h3>

              {data.agreements.length > 0 ? (
                <div className="space-y-3">
                  {data.agreements.map((a, idx) => (
                    <div key={idx} className="p-4 bg-slate-950/70 border border-emerald-500/20 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-100 font-bold">{a.entity}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[10px]">
                            {a.relation}
                          </span>
                          <span className="text-slate-100 font-bold">{a.target}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-800/60">
                        <div><span className="text-amber-400">Source A:</span> {a.evidence_a}</div>
                        <div><span className="text-violet-400">Source B:</span> {a.evidence_b}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs font-mono text-slate-400 text-center py-4">
                  No explicit cross-tradition agreements indexed between these two sources.
                </div>
              )}
            </div>

            {/* Unique Claims */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-serif text-sm font-bold text-amber-300">Unique to Source A</h4>
                {data.unique_to_a.map((u, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-200">
                    {u.entity} — [{u.relation}] → {u.target}
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="font-serif text-sm font-bold text-violet-300">Unique to Source B</h4>
                {data.unique_to_b.map((u, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs font-mono text-slate-200">
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
