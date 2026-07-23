"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { fetchCharacters } from "@/lib/api";
import { Character } from "@/lib/types";
import { Search, X, GitCommit, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react";

function CharacterExplorerContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";

  const [characters, setCharacters] = useState<Character[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = (queryStr: string) => {
    setLoading(true);
    setError(null);

    fetchCharacters(queryStr)
      .then((res) => {
        setCharacters(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load characters.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData(search);
  }, [search]);

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
              Browse classical pantheons, canonical aliases (e.g., Zeus / Jupiter, Athena / Minerva), and graph neighborhoods.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search figure or alias (e.g. Jupiter, Ulysses)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-8 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-500 hover:text-slate-300"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(search)}
              className="flex items-center gap-1 px-3 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg font-mono text-[11px]"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Character Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 animate-pulse">
                <div className="h-10 w-10 bg-slate-800 rounded-xl" />
                <div className="h-5 w-32 bg-slate-800 rounded-md" />
                <div className="h-3 w-44 bg-slate-800 rounded-md" />
              </div>
            ))}
          </div>
        ) : characters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {characters.map((char) => (
              <Link
                key={char.id}
                href={`/characters/${char.id}`}
                className="bg-slate-900/70 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 group backdrop-blur-sm flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shadow-sm">
                      {char.avatar || "🏛️"}
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
                    {char.aliases && char.aliases.map((alias) => (
                      <span key={alias} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-950/60 border border-slate-800/80 rounded text-amber-400/80">
                        {alias}
                      </span>
                    ))}
                  </div>
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
              </Link>
            ))}
          </div>
        ) : (
          /* Styled No-Results State */
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Search size={24} />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-200">No Mythic Figures Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No characters or cross-tradition aliases matched your search: <span className="text-amber-300 font-mono">"{search}"</span>
              </p>
            </div>
            <button
              onClick={() => setSearch("")}
              className="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono hover:bg-amber-500/30 transition-colors"
            >
              Reset Search Filter
            </button>
          </div>
        )}
      </div>
    </Navigation>
  );
}

export default function CharacterExplorerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-amber-400 font-mono text-xs">Loading Character Explorer...</div>}>
      <CharacterExplorerContent />
    </Suspense>
  );
}
