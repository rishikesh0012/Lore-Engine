"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { fetchDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";
import { Users, GitFork, BookOpen, AlertTriangle, ArrowUpRight, Cpu, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <Navigation>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-800/60 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-900/60 border border-slate-800 rounded-2xl" />
            ))}
          </div>
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
            System Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Real-time cross-tradition graph intelligence & pipeline statistics.
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <h3 className="text-2xl font-serif font-bold text-violet-300 mt-1">{data.stats.total_relationships}</h3>
              <span className="text-[10px] text-violet-400 font-mono mt-1 inline-block">Across 4 traditions</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <GitFork size={22} />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Sources Indexed</p>
              <h3 className="text-2xl font-serif font-bold text-emerald-300 mt-1">{data.stats.sources_indexed}</h3>
              <span className="text-[10px] text-slate-400 font-mono mt-1 inline-block">6,329 passages total</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen size={22} />
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Active Conflicts</p>
              <h3 className="text-2xl font-serif font-bold text-rose-300 mt-1">{data.stats.active_conflicts}</h3>
              <span className="text-[10px] text-rose-400 font-mono mt-1 inline-block">High confidence bounded</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle size={22} />
            </div>
          </div>
        </div>

        {/* Live Extraction Monitor & Source Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="text-amber-400 w-5 h-5" />
                <h3 className="font-serif text-base font-bold text-slate-100">Pipeline Status</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Active Run
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Target Source:</span>
                <span className="text-amber-300 font-semibold">{data.pipeline_status.current_source}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">Adaptive Rate:</span>
                <span className="text-emerald-400 font-semibold">{data.pipeline_status.rpm} RPM</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800/60">
                <span className="text-slate-400">429 Errors / Trips:</span>
                <span className="text-slate-200">{data.pipeline_status.errors_429} ({data.pipeline_status.circuit_breaker})</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Estimated Completion:</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {data.pipeline_status.eta}
                </span>
              </div>
            </div>
          </div>

          {/* Sources List */}
          <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="font-serif text-base font-bold text-slate-100 mb-4">Indexed Sources Matrix</h3>
            <div className="space-y-3">
              {data.sources.map((src) => (
                <div key={src.id} className="flex items-center justify-between p-3.5 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    {src.status === "Completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400" />
                    )}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{src.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{src.passages} passages processed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-300">{src.relationships} edges</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      src.status === "Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {src.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Distribution & Top Entities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Relationship Type Breakdown */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="font-serif text-base font-bold text-slate-100 mb-4">Relationship Types Breakdown</h3>
            <div className="space-y-3 font-mono text-xs">
              {data.relationship_distribution.map((rel) => (
                <div key={rel.name} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-semibold">{rel.name}</span>
                    <span className="text-slate-400">{rel.count} edges</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(rel.count / 350) * 100}%`, backgroundColor: rel.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Connected Entities */}
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-base font-bold text-slate-100">Top Connected Figures</h3>
              <Link href="/characters" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                Explore All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {data.most_connected.map((char) => (
                <div key={char.name} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800/40 rounded-xl hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-300 text-xs">
                      {char.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{char.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{char.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400">{char.connections} connections</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
