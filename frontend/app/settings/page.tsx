"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Settings, Database, Cpu, CheckCircle2, ShieldCheck, Moon, Sun, Sliders } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState("dark");
  const [nodeSizing, setNodeSizing] = useState("connections");
  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
            Engine Settings & System Health
          </h1>
          <p className="text-xs text-slate-400">
            Database connection parameters, graph physics options, and UI preferences.
          </p>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Neo4j Database</span>
              <h4 className="text-sm font-bold text-slate-200 mt-1">bolt://localhost:7688</h4>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Connected (Active)
              </span>
            </div>
            <Database className="text-emerald-400 w-6 h-6" />
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Qdrant Vector DB</span>
              <h4 className="text-sm font-bold text-slate-200 mt-1">http://localhost:6337</h4>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Collection Ready
              </span>
            </div>
            <Cpu className="text-emerald-400 w-6 h-6" />
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">FastAPI Backend</span>
              <h4 className="text-sm font-bold text-slate-200 mt-1">http://localhost:8002</h4>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> 8 Endpoints Healthy
              </span>
            </div>
            <ShieldCheck className="text-emerald-400 w-6 h-6" />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
          <h3 className="font-serif text-base font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Graph Rendering & Display Preferences
          </h3>

          <div className="space-y-4 text-xs font-mono">
            {/* Theme */}
            <div className="flex justify-between items-center py-3 border-b border-slate-800/60">
              <div>
                <span className="text-slate-200 font-semibold block">UI Color Theme</span>
                <span className="text-[11px] text-slate-400">Choose between Obsidian Dark and Classical Light.</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${theme === "dark" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400"}`}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 ${theme === "light" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "text-slate-400"}`}
                >
                  <Sun size={14} /> Light
                </button>
              </div>
            </div>

            {/* Node Sizing */}
            <div className="flex justify-between items-center py-3 border-b border-slate-800/60">
              <div>
                <span className="text-slate-200 font-semibold block">Graph Node Sizing</span>
                <span className="text-[11px] text-slate-400">Scale node radius by total connections or uniform size.</span>
              </div>
              <select
                value={nodeSizing}
                onChange={(e) => setNodeSizing(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 focus:outline-none"
              >
                <option value="connections">By Connection Count</option>
                <option value="uniform">Uniform Radius</option>
              </select>
            </div>

            {/* Force Physics */}
            <div className="flex justify-between items-center py-3">
              <div>
                <span className="text-slate-200 font-semibold block">Enable 2D Force Physics Simulation</span>
                <span className="text-[11px] text-slate-400">Dynamic repulsion and edge attraction simulation.</span>
              </div>
              <button
                onClick={() => setPhysicsEnabled(!physicsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${physicsEnabled ? "bg-emerald-500" : "bg-slate-800"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${physicsEnabled ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
