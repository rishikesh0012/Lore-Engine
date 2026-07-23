"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { fetchDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";
import { Users, GitFork, BookOpen, AlertTriangle, ArrowUpRight, Cpu, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    let isMounted = true;

    fetchDashboard()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load dashboard data.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cancel = loadData();
    return () => cancel();
  }, []);

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              System Dashboard
            </h1>
            <p className="text-xs text-slate-400">
              Real-time cross-tradition graph intelligence & pipeline statistics.
            </p>
          </div>

          {error && (
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono hover:bg-amber-500/30 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>

        {/* Error State Banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex items-center gap-3 text-red-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="font-bold">Dashboard Synchronization Failure</p>
              <p className="text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))
          ) : data ? (
            <>
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Characters</p>
                  <h3 className="text-2xl font-serif font-bold text-amber-300 mt-1">{data.stats.total_characters}</h3>
                  <span className="text-[10px] text-emerald-400 font-mono mt-1 inline-block">↑ 12 canonical aliases</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Users size={22} />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Total Relationships</p>
                  <h3 className="text-2xl font-serif font-bold text-purple-300 mt-1">{data.stats.total_relationships}</h3>
                  <span className="text-[10px] text-purple-400 font-mono mt-1 inline-block">Cross-verified graph</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <GitFork size={22} />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Sources Ingested</p>
                  <h3 className="text-2xl font-serif font-bold text-teal-300 mt-1">{data.stats.sources_indexed}</h3>
                  <span className="text-[10px] text-teal-400 font-mono mt-1 inline-block">Classic manuscripts</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <BookOpen size={22} />
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Active Conflicts</p>
                  <h3 className="text-2xl font-serif font-bold text-rose-300 mt-1">{data.stats.active_conflicts}</h3>
                  <span className="text-[10px] text-rose-400 font-mono mt-1 inline-block">Disputed parentages</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle size={22} />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Sources Grid & Pipeline Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-serif font-bold text-slate-200">Source Text Repositories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : data ? (
                data.sources.map((src) => (
                  <div key={src.id} className="bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-all rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-amber-200 text-sm">{src.name}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        src.status === "Completed" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" :
                        src.status === "Processing" ? "bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse" :
                        "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {src.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>Passages: {src.passages}</span>
                      <span>Extracted: {src.relationships}</span>
                    </div>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {/* Pipeline Monitor Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-purple-400" /> Pipeline Monitor
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              </div>

              {loading ? (
                <div className="py-6 space-y-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ) : data ? (
                <div className="space-y-4 py-4">
                  <div>
                    <p className="text-xs text-slate-400">Current Extracting Source</p>
                    <p className="font-mono text-sm font-bold text-amber-300 mt-0.5">{data.pipeline_status.current_source}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{data.pipeline_status.progress_pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-purple-500 transition-all duration-500" style={{ width: `${data.pipeline_status.progress_pct}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs font-mono text-slate-400">
                    <div>
                      <span className="text-[10px] text-slate-500 block">THROUGHPUT</span>
                      <span>{data.pipeline_status.rpm} RPM</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">ESTIMATED ETA</span>
                      <span>{data.pipeline_status.eta}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/graph"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-mono transition-colors"
            >
              Explore Knowledge Graph <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
