"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Network, 
  MessageSquare, 
  GitCompare, 
  Database, 
  BarChart3, 
  Settings, 
  Sparkles,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { fetchCharacters, fetchHealthStatus } from "@/lib/api";
import { Character } from "@/lib/types";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Character Explorer", href: "/characters", icon: Users },
  { name: "Knowledge Graph", href: "/graph", icon: Network },
  { name: "Natural Language Search", href: "/ask", icon: MessageSquare },
  { name: "Source Comparison", href: "/compare", icon: GitCompare },
  { name: "Relationship Browser", href: "/relationships", icon: Database },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

function GlobalQuickSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      fetchCharacters(query.trim())
        .then((res) => {
          setResults(res.items || []);
          setSelectedIndex(0);
          setIsOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && results.length > 0 && results[selectedIndex]) {
        router.push(`/characters/${results[selectedIndex].id}`);
        setIsOpen(false);
      } else if (query.trim()) {
        router.push(`/characters?search=${encodeURIComponent(query.trim())}`);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-96">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim() && setIsOpen(true)}
        placeholder="Quick search characters, relationships, or sources (↑↓ Enter)..."
        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 pl-10 pr-8 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors font-sans"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 animate-spin" />
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-md max-h-80 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-1 space-y-0.5">
              {results.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(`/characters/${item.id}`);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                    idx === selectedIndex
                      ? "bg-amber-500/15 border border-amber-500/30 text-amber-200"
                      : "hover:bg-slate-800/60 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base">{item.avatar || "🏛️"}</span>
                    <div className="truncate">
                      <p className="text-xs font-bold font-serif text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{item.title}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-400 font-mono">
              No matching characters found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [health, setHealth] = useState<{ status: string; neo4j: boolean }>({ status: "checking", neo4j: false });

  useEffect(() => {
    fetchHealthStatus().then((res) => setHealth(res));
  }, []);

  const isHealthy = health.status === "ok" || health.status === "ok (mock)";

  return (
    <div className="flex h-screen bg-[#0D0B14] text-[#EDE6D6] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#17131F] border-r border-purple-500/20 flex flex-col justify-between p-4 flex-shrink-0 z-20">
        <div>
          {/* Logo Header */}
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 mb-6 rounded-xl hover:bg-purple-950/40 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-900 to-[#7A5FB0] border border-[#D4A344]/30 flex items-center justify-center shadow-lg shadow-purple-950 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-[#D4A344] font-bold" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold tracking-wider text-[#D4A344] uppercase">
                Lore Engine
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-[#9C93A8] font-mono">
                Mythic Intelligence
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-900/60 to-[#1C1830] text-[#D4A344] border border-[#D4A344]/40 shadow-md shadow-purple-950"
                      : "text-[#9C93A8] hover:text-[#EDE6D6] hover:bg-purple-950/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#D4A344]" : "text-[#9C93A8]"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Live Extraction Monitor Widget */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[11px] mb-2 font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              Pipeline {isHealthy ? "Active" : "Standby"}
            </span>
            <span className="text-amber-400 font-semibold">25.0 RPM</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full w-[100%]" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
            <span>Odyssey (Completed)</span>
            <span>1,556 Rels</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0F1420]/80 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          {/* Quick Search */}
          <GlobalQuickSearch />

          {/* Quick Info / Controls */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border rounded-xl font-mono text-[11px] ${isHealthy ? "border-emerald-500/30 text-emerald-300" : "border-amber-500/30 text-amber-300"}`}>
              {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              <span>Backend: {isHealthy ? "Online" : "Disconnected"}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              LE
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0A0D14] scrollbar-thin scrollbar-thumb-slate-800">
          {children}
        </main>
      </div>
    </div>
  );
}
