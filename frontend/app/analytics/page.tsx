"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { fetchAnalytics } from "@/lib/api";
import { AnalyticsData } from "@/lib/types";
import { BarChart3, PieChart, Activity, Cpu, Layers } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <Navigation>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-800/60 rounded" />
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl" />
        </div>
      </Navigation>
    );
  }

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
            Graph Network Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Centrality metrics, degree distribution, and cross-tradition source weight statistics.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Node Count</span>
            <h3 className="text-xl font-serif font-bold text-amber-300 mt-1">{data.network_stats.node_count}</h3>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Edge Count</span>
            <h3 className="text-xl font-serif font-bold text-violet-300 mt-1">{data.network_stats.edge_count}</h3>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Avg Degree</span>
            <h3 className="text-xl font-serif font-bold text-emerald-300 mt-1">{data.network_stats.avg_degree}</h3>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Graph Density</span>
            <h3 className="text-xl font-serif font-bold text-blue-300 mt-1">{data.network_stats.density}</h3>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400">Network Diameter</span>
            <h3 className="text-xl font-serif font-bold text-rose-300 mt-1">{data.network_stats.diameter} hops</h3>
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
                  <div className="flex justify-between">
                    <span className="text-slate-200 font-semibold">{s.source}</span>
                    <span className="text-amber-400">{s.relationships} edges ({s.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-violet-600 h-full rounded-full" style={{ width: `${s.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
