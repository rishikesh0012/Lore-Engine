"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Shuffle, Database, GitCommit, Activity, ArrowRight, Sparkles } from "lucide-react";

const UNIVERSES = [
  { 
    id: "hesiod_theogony", 
    title: "Hesiod's Theogony", 
    desc: "The origins of the cosmos and the pantheon.",
    badge: "139 Passages",
    color: "from-purple-900/40 to-slate-900" 
  },
  { 
    id: "homer_iliad", 
    title: "Homer's Iliad", 
    desc: "The great clash at Troy and divine intervention.",
    badge: "2,143 Passages",
    color: "from-amber-900/30 to-slate-900" 
  },
  { 
    id: "ovid_metamorphoses", 
    title: "Ovid's Metamorphoses", 
    desc: "Myths of transformation and Roman retellings.",
    badge: "3,020 Passages",
    color: "from-indigo-900/40 to-slate-900" 
  }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <main className="min-h-screen bg-[#0D0B14] text-[#EDE6D6] font-sans relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
      {/* Night Sky Background & Star Field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-purple-900/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-5xl w-full z-10 space-y-12">
        {/* Navigation Bar Header */}
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400/80 uppercase tracking-widest">
            <Sparkles size={14} className="text-amber-400" />
            <span>Lore Engine v2.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link href="/dashboard" className="text-slate-400 hover:text-amber-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/graph" className="text-slate-400 hover:text-amber-300 transition-colors">
              Knowledge Graph
            </Link>
            <Link href="/ask" className="text-slate-400 hover:text-amber-300 transition-colors">
              NL Search
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <header className="text-center space-y-4">
          <h1 className="font-serif text-6xl md:text-7xl text-[#D4A344] tracking-widest font-light uppercase drop-shadow-md">
            Lore Engine
          </h1>
          <p className="text-[#9C93A8] tracking-widest uppercase font-mono text-xs md:text-sm">
            Cross-Referencing the Cosmos of Ancient Myth
          </p>
        </header>

        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9C93A8]" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all pantheons..." 
              className="w-full bg-[#17131F]/80 border border-[#D4A344]/25 rounded-2xl py-4 pl-12 pr-4 text-sm text-[#EDE6D6] focus:outline-none focus:border-[#D4A344]/60 transition-colors placeholder:text-[#9C93A8]/50 shadow-xl backdrop-blur-md"
            />
          </div>
          <Link href="/compare">
            <button className="flex items-center justify-center gap-2.5 px-6 py-4 bg-[#7A5FB0]/20 border border-[#7A5FB0]/40 rounded-2xl hover:bg-[#7A5FB0]/30 transition-all text-[#7A5FB0] hover:text-amber-300 font-medium tracking-wide shadow-lg group w-full sm:w-auto">
              <Shuffle size={18} className="group-hover:rotate-180 transition-transform duration-500 text-amber-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300">Random Conflict</span>
            </button>
          </Link>
        </div>

        {/* 3 Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-[#1C1830]/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 backdrop-blur-md hover:border-[#D4A344]/40 transition-all shadow-xl group">
            <Database className="text-[#D4A344] group-hover:scale-110 transition-transform" size={28} />
            <span className="text-4xl font-serif font-semibold text-[#EDE6D6]">4</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9C93A8]">Source Texts</span>
          </div>

          <div className="bg-[#1C1830]/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 backdrop-blur-md hover:border-[#D4A344]/40 transition-all shadow-xl group">
            <GitCommit className="text-[#D4A344] group-hover:scale-110 transition-transform" size={28} />
            <span className="text-4xl font-serif font-semibold text-[#EDE6D6]">1,145</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9C93A8]">Mapped Entities</span>
          </div>

          <div className="bg-[#1C1830]/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 backdrop-blur-md hover:border-[#C1443C]/40 transition-all shadow-xl group">
            <Activity className="text-[#C1443C] group-hover:scale-110 transition-transform" size={28} />
            <span className="text-4xl font-serif font-semibold text-[#EDE6D6]">52</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#9C93A8]">Contradictions</span>
          </div>
        </div>

        {/* "Explore the Threads" Section */}
        <section className="space-y-6 pt-6">
          <div className="text-center">
            <h2 className="font-serif text-2xl text-[#D4A344] tracking-widest font-light uppercase">
              Explore the Threads
            </h2>
            <p className="text-[#9C93A8] font-mono text-xs tracking-wider mt-1">
              Select a mythic tradition to inspect its graph universe
            </p>
          </div>

          {/* Source Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UNIVERSES.map((u) => (
              <Link key={u.id} href={`/graph?source=${u.id}`}>
                <div className={`bg-gradient-to-b ${u.color} border border-purple-500/20 hover:border-[#D4A344]/50 rounded-2xl p-6 space-y-4 hover:-translate-y-1 transition-all duration-300 shadow-xl group cursor-pointer h-full flex flex-col justify-between`}>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-amber-300 border border-purple-500/30">
                        {u.badge}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#EDE6D6] group-hover:text-[#D4A344] transition-colors">
                      {u.title}
                    </h3>
                    <p className="text-xs text-[#9C93A8] leading-relaxed">
                      {u.desc}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-mono text-[#D4A344] font-semibold pt-4 group-hover:translate-x-1 transition-transform">
                    Enter Graph Universe <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
