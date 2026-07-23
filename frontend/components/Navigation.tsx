"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Activity
} from "lucide-react";

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

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Pipeline Active
            </span>
            <span className="text-amber-400 font-semibold">25.0 RPM</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full w-[85%]" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
            <span>Odyssey (85%)</span>
            <span>ETA: 02m 15s</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0F1420]/80 border-b border-slate-800/80 backdrop-blur-md px-6 flex items-center justify-between z-10">
          {/* Quick Search */}
          <div className="relative w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Quick search characters, relationships, or sources..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors font-sans"
            />
          </div>

          {/* Quick Info / Controls */}
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl font-mono text-[11px]">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Neo4j: Connected (7688)</span>
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
