"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { fetchRelationships } from "@/lib/api";
import { Relationship } from "@/lib/types";
import { Search, Filter, Download, ChevronLeft, ChevronRight, FileText } from "lucide-react";

const RELATION_TYPES = ["ALL", "PARENT_OF", "SIBLING_OF", "MARRIED_TO", "ALLIES_WITH", "OPPOSES", "CAUSED_BY", "LOCATED_AT"];

export default function RelationshipBrowserPage() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetchRelationships(filterType, search).then((res) => {
      setRelationships(res.items);
      setLoading(false);
    });
  }, [filterType, search, page]);

  const handleExportCSV = () => {
    const headers = "id,entity_a,relation_type,entity_b,source,confidence\n";
    const rows = relationships.map(r => `${r.id},${r.entity_a},${r.relation_type},${r.entity_b},${r.source},${r.confidence}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lore_engine_relationships.csv";
    a.click();
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(relationships, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lore_engine_relationships.json";
    a.click();
  };

  return (
    <Navigation>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-slate-100">
              Relationship Browser
            </h1>
            <p className="text-xs text-slate-400">
              Complete tabular index of extracted narrative relationships across all source texts.
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs font-mono text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <FileText size={14} /> Export JSON
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          {/* Relation Type Pills */}
          <div className="flex flex-wrap gap-1.5">
            {RELATION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  filterType === t
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                    : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search entity..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Enterprise Data Table */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="p-4">Entity A</th>
                <th className="p-4">Relation Type</th>
                <th className="p-4">Entity B</th>
                <th className="p-4">Source Text</th>
                <th className="p-4 text-right">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 animate-pulse">
                    Loading relationship matrix...
                  </td>
                </tr>
              ) : relationships.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No relationships found matching filters.
                  </td>
                </tr>
              ) : (
                relationships.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-semibold text-amber-300">{r.entity_a}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.relation_type === "OPPOSES" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                        r.relation_type === "ALLIES_WITH" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {r.relation_type}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">{r.entity_b}</td>
                    <td className="p-4 text-slate-400">{r.source}</td>
                    <td className="p-4 text-right font-bold text-emerald-400">
                      {(r.confidence * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Showing {relationships.length} relationships</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Navigation>
  );
}
