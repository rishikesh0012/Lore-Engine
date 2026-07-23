"use client";

import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Settings, Database, Cpu, CheckCircle2, AlertTriangle, ShieldCheck, Moon, Sun, Sliders, Check, CircleDot, Zap } from "lucide-react";
import { fetchHealthStatus, getApiBaseUrl } from "@/lib/api";

interface LoreSettings {
  theme: "dark" | "darker" | "mythic";
  graphNodeSizing: "connections" | "equal" | "degree";
  physicsEnabled: boolean;
}

const DEFAULT_SETTINGS: LoreSettings = {
  theme: "mythic",
  graphNodeSizing: "connections",
  physicsEnabled: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<LoreSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [health, setHealth] = useState<{ status: string; neo4j: boolean; qdrant: boolean }>({
    status: "Checking service health...",
    neo4j: false,
    qdrant: false
  });
  const [savedBanner, setSavedBanner] = useState(false);

  // Restore saved preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lore_engine_settings");
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load settings from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist preferences to localStorage on change
  const updateSettings = (newSettings: Partial<LoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem("lore_engine_settings", JSON.stringify(updated));
        setSavedBanner(true);
        setTimeout(() => setSavedBanner(false), 2000);
      } catch (e) {
        console.error("Failed to persist settings", e);
      }
      return updated;
    });
  };

  // Fetch real system health status
  useEffect(() => {
    fetchHealthStatus().then((res) => setHealth(res));
  }, []);

  const isHealthy = health.status === "ok" || health.status === "ok (mock)";

  return (
    <Navigation>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              Engine Settings & System Health
            </h1>
            <p className="text-xs text-slate-400">
              Real-time API health parameters, graph physics options, and persistent UI preferences.
            </p>
          </div>

          {/* Auto-Save Indicator */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono transition-all duration-300 ${
            savedBanner
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold scale-105"
              : "bg-slate-900 text-slate-400 border-slate-800"
          }`}>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{savedBanner ? "✓ Preferences Saved Automatically" : "Auto-Saves to Local Storage"}</span>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Neo4j Database</span>
              <h4 className="text-xs font-bold text-slate-200 mt-1 font-mono truncate max-w-[180px]">
                {health.neo4j ? "Bolt Live Cluster" : "Neo4j Graph Service"}
              </h4>
              <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${health.neo4j ? "text-emerald-400 font-bold" : "text-amber-400"}`}>
                {health.neo4j ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {health.neo4j ? "Connected (Bolt 7688)" : "Disconnected"}
              </span>
            </div>
            <Database className={`${health.neo4j ? "text-emerald-400" : "text-amber-400"} w-6 h-6`} />
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Qdrant Vector DB</span>
              <h4 className="text-xs font-bold text-slate-200 mt-1 font-mono truncate max-w-[180px]">
                {health.qdrant ? "Collection Ready" : "Qdrant Vector Store"}
              </h4>
              <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${health.qdrant ? "text-emerald-400 font-bold" : "text-amber-400"}`}>
                {health.qdrant ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {health.qdrant ? "Collection Active" : "Disconnected"}
              </span>
            </div>
            <Cpu className={`${health.qdrant ? "text-emerald-400" : "text-amber-400"} w-6 h-6`} />
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">FastAPI Backend</span>
              <h4 className="text-xs font-bold text-slate-200 mt-1 font-mono truncate max-w-[180px]">
                {getApiBaseUrl()}
              </h4>
              <span className={`text-[10px] font-mono flex items-center gap-1 mt-1 ${isHealthy ? "text-emerald-400 font-bold" : "text-amber-400"}`}>
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
            <Sliders className="w-5 h-5 text-amber-400" /> Graph Physics & Visual Preferences
          </h2>

          {/* 1. Force Simulation Toggle */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Force Physics Simulation</h3>
              <p className="text-xs text-slate-400">Enable 2D force-directed layout physics on knowledge graph nodes.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.physicsEnabled}
              aria-label="Toggle force physics simulation"
              onClick={() => updateSettings({ physicsEnabled: !settings.physicsEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                settings.physicsEnabled ? "bg-amber-500" : "bg-slate-800"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                  settings.physicsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 2. Graph Node Sizing */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Node Sizing Metric</h3>
              <p className="text-xs text-slate-400">Controls how graph node radii are calculated on canvas.</p>
            </div>
            <div className="flex gap-2">
              {(["connections", "equal", "degree"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={settings.graphNodeSizing === mode}
                  aria-label={`Set node sizing to ${mode}`}
                  onClick={() => updateSettings({ graphNodeSizing: mode })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                    settings.graphNodeSizing === mode
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Theme Preset Selector */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Theme Preset</h3>
              <p className="text-xs text-slate-400">Choose visual color palette for canvas and navigation.</p>
            </div>
            <div className="flex gap-2">
              {(["mythic", "dark", "darker"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={settings.theme === t}
                  aria-label={`Set theme preset to ${t}`}
                  onClick={() => updateSettings({ theme: t })}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                    settings.theme === t
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-purple-400" /> {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
