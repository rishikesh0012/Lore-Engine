"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { fetchCharacters, fetchCharacterProfile } from "@/lib/api";
import { Character } from "@/lib/types";
import { Search, X, GitCommit, BookOpen, ShieldAlert, ArrowRight } from "lucide-react";

export default function CharacterExplorerPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [search, setSearch] = useState("");
  const [selectedChar, setSelectedChar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacters(search).then((res) => {
      setCharacters(res.items);
      setLoading(false);
    });
  }, [search]);

  const handleSelect = async (id: string) => {
    const prof = await fetchCharacterProfile(id);
    setSelectedChar(prof);
  };

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              Character Explorer
            </h1>
            <p className="text-xs text-slate-400">
              Browse classical pantheons, canonical aliases, and individual graph neighborhoods.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search figure or alias (e.g. Zeus, Jove)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Character Grid & Detail Modal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {characters.map((char) => (
            <div
              key={char.id}
              onClick={() => handleSelect(char.id)}
              className="bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 group backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">
                  {char.avatar}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {char.tradition}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                {char.name}
              </h3>
              <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">{char.title}</p>

              {/* Aliases Pills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {char.aliases.map((alias) => (
                  <span key={alias} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-950/60 border border-slate-800/80 rounded text-amber-400/80">
                    {alias}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-3 border-t border-slate-800/60">
                <span className="flex items-center gap-1">
                  <GitCommit className="w-3 h-3 text-amber-400" />
                  {char.connectionsCount} links
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                  View Profile <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Character Detail Drawer / Modal */}
        {selectedChar && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex justify-end">
            <div className="w-full max-w-xl bg-[#0F1420] border-l border-slate-800 p-6 overflow-y-auto space-y-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
                    {selectedChar.profile.avatar}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-amber-300">{selectedChar.profile.name}</h2>
                    <p className="text-xs text-slate-400">{selectedChar.profile.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChar(null)}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Aliases */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Canonical Cross-Tradition Aliases</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedChar.profile.aliases.map((a: string) => (
                    <span key={a} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-300">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Mythological Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedChar.profile.summary}</p>
              </div>

              {/* Relationships Table */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Extracted Graph Neighborhood</h4>
                <div className="space-y-2">
                  {selectedChar.relationships.map((rel: any) => (
                    <div key={rel.id} className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-semibold">{rel.entity_a}</span>
                        <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/30 text-violet-300 rounded text-[10px]">
                          {rel.relation_type}
                        </span>
                        <span className="text-slate-200 font-semibold">{rel.entity_b}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{rel.source}</span>
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
