"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Settings, Database, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Moon, Sun, Sliders } from "lucide-react";
import { fetchHealthStatus, getApiBaseUrl } from "@/lib/api";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [nodeSizing, setNodeSizing] = useState("connections");
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [health, setHealth] = useState<{ status: string; neo4j: boolean; qdrant: boolean }>({
    status: "checking...",
    neo4j: false,
    qdrant: false
  });

  useEffect(() => {
    fetchHealthStatus().then((res) => setHealth(res));
  }, []);

  const isHealthy = health.status === "ok" || health.status === "ok (mock)";

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
            Engine Settings & System Health
          </h1>
          <p className="text-xs text-slate-400">
            Real-time API health parameters, graph physics options, and UI preferences.
          </p>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Neo4j Database</span>
              <h4 className="text-sm font-bold text-slate-200 mt-1 font-mono text-xs truncate max-w-[180px]">
                {health.neo4j ? "Graph Cluster Online" : "Neo4j Service"}
              </h4>
              <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${health.neo4j ? "text-emerald-400" : "text-amber-400"}`}>
                {health.neo4j ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {health.neo4j ? "Connected" : "Not Connected"}
              </span>
            </div>
            <Database className={`${health.neo4j ? "text-emerald-400" : "text-amber-400"} w-6 h-6`} />
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Qdrant Vector DB</span>
              <h4 className="text-sm font-bold text-slate-200 mt-1 font-mono text-xs truncate max-w-[180px]">
                {health.qdrant ? "Collection Active" : "Vector DB Service"}
              </h4>
              <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${health.qdrant ? "text-emerald-400" : "text-amber-400"}`}>
                {health.qdrant ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {health.qdrant ? "Collection Ready" : "Not Connected"}
              </span>
            </div>
            <Cpu className={`${health.qdrant ? "text-emerald-400" : "text-amber-400"} w-6 h-6`} />
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">FastAPI Backend</span>
              <h4 className="text-sm font-bold text-slate-200 mt-1 font-mono text-xs truncate max-w-[180px]">
                {getApiBaseUrl()}
              </h4>
              <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${isHealthy ? "text-emerald-400" : "text-amber-400"}`}>
                {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {isHealthy ? `Status: ${health.status}` : "API Reachability Issue"}
              </span>
            </div>
            <ShieldCheck className={`${isHealthy ? "text-emerald-400" : "text-amber-400"} w-6 h-6`} />
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-serif font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" /> Graph Physics & Theme
          </h2>

          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Force Simulation</h3>
              <p className="text-xs text-slate-400">Enable or disable 2D physics simulation on graph nodes.</p>
            </div>
            <button
              onClick={() => setPhysicsEnabled(!physicsEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                physicsEnabled ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-slate-800 text-slate-400"
              }`}
            >
              {physicsEnabled ? "Physics ON" : "Physics OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Theme Preset</h3>
              <p className="text-xs text-slate-400">Dark Obsidian Mythic Theme active.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono ${
                  theme === "dark" ? "bg-purple-600/30 text-purple-300 border border-purple-500/40" : "bg-slate-800 text-slate-400"
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
