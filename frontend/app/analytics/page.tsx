"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { fetchAnalytics } from "@/lib/api";
import { AnalyticsData } from "@/lib/types";
import { BarChart3, PieChart, Activity, Cpu, Layers, AlertTriangle, RefreshCw, Clock } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAnalytics = () => {
    setLoading(true);
    setError(null);

    fetchAnalytics()
      .then((res) => {
        setData(res);
        setLastUpdated(new Date());
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch network analytics data.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header with Last-Updated Timestamp */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              Graph Network Analytics
            </h1>
            <p className="text-xs text-slate-400">
              Centrality metrics, degree distribution, and cross-tradition source weight statistics.
            </p>
          </div>

          {lastUpdated && !loading && !error && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Last updated: <strong className="text-amber-300">{lastUpdated.toLocaleTimeString()}</strong></span>
              <button
                onClick={loadAnalytics}
                aria-label="Refresh network analytics"
                className="p-1 hover:text-amber-300 transition-colors ml-1"
                title="Refresh Analytics"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadAnalytics}
              className="flex items-center gap-1 px-3 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg font-mono text-[11px]"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-900/60 border border-slate-800 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl" />
              <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Live Network Metrics */}
        {!loading && !error && data && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400">Total Entities</span>
                <h3 className="text-xl font-serif font-bold text-amber-300 mt-1">
                  {data.network_stats.node_count.toLocaleString()}
                </h3>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400">Total Relationships</span>
                <h3 className="text-xl font-serif font-bold text-violet-300 mt-1">
                  {data.network_stats.edge_count.toLocaleString()}
                </h3>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400">Avg Degree</span>
                <h3 className="text-xl font-serif font-bold text-emerald-300 mt-1">
                  {data.network_stats.avg_degree}
                </h3>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400">Graph Density</span>
                <h3 className="text-xl font-serif font-bold text-blue-300 mt-1">
                  {data.network_stats.density}
                </h3>
              </div>
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-slate-400">Network Diameter</span>
                <h3 className="text-xl font-serif font-bold text-rose-300 mt-1">
                  {data.network_stats.diameter} hops
                </h3>
              </div>
            </div>

            {/* Centrality Rankings & Source Contribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Centrality Table */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="font-serif text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Betweenness Centrality Rankings
                </h3>
                <div className="space-y-3 font-mono text-xs">
                  {data.centrality_rankings.map((c, idx) => (
                    <div key={c.character} className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-bold w-4">#{idx + 1}</span>
                        <span className="text-slate-200 font-semibold">{c.character}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="text-slate-400">Deg: {c.degree}</span>
                        <span className="text-emerald-400 font-bold">Betw: {c.betweenness}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Contributions */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="font-serif text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-400" />
                  Source Contribution Weight
                </h3>
                <div className="space-y-4 font-mono text-xs">
                  {data.source_contributions.map((s) => (
                    <div key={s.source} className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-200">{s.source}</span>
                        <span className="text-amber-300 font-bold">{s.relationships} rels ({s.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full"
                          style={{ width: `${s.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navigation>
  );
}
