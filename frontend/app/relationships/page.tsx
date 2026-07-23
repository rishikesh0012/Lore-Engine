"use client";

import { useEffect, useState, useMemo } from "react";
import Navigation from "@/components/Navigation";
import { fetchRelationships } from "@/lib/api";
import { Relationship } from "@/lib/types";
import { Search, Filter, Download, ChevronLeft, ChevronRight, FileText, AlertTriangle, RefreshCw } from "lucide-react";

const RELATION_TYPES = ["ALL", "PARENT_OF", "SIBLING_OF", "MARRIED_TO", "ALLIES_WITH", "OPPOSES", "CAUSED_BY", "LOCATED_AT"];
const PAGE_SIZE = 10;

export default function RelationshipBrowserPage() {
  const [allRelationships, setAllRelationships] = useState<Relationship[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadData = () => {
    setLoading(true);
    setError(null);

    fetchRelationships()
      .then((res) => {
        setAllRelationships(res.items || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch relationship index.");
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered dataset composing relation_type AND search query across entity_a AND entity_b
  const filteredRelationships = useMemo(() => {
    return allRelationships.filter((r) => {
      const matchesType = filterType === "ALL" || r.relation_type.toUpperCase() === filterType.toUpperCase();
      const s = search.trim().toLowerCase();
      const matchesSearch = !s || r.entity_a.toLowerCase().includes(s) || r.entity_b.toLowerCase().includes(s) || r.source.toLowerCase().includes(s);
      return matchesType && matchesSearch;
    });
  }, [allRelationships, filterType, search]);

  // Reset page to 1 whenever filters or search query change
  useEffect(() => {
    setPage(1);
  }, [filterType, search]);

  // Pagination boundaries
  const totalFiltered = filteredRelationships.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRelationships.slice(start, start + PAGE_SIZE);
  }, [filteredRelationships, currentPage]);

  const startCount = totalFiltered > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const endCount = Math.min(currentPage * PAGE_SIZE, totalFiltered);

  // Export CSV using CURRENTLY FILTERED dataset
  const handleExportCSV = () => {
    const headers = "id,entity_a,relation_type,entity_b,source,confidence\n";
    const rows = filteredRelationships
      .map((r) => `${r.id},"${r.entity_a}",${r.relation_type},"${r.entity_b}","${r.source}",${r.confidence}`)
      .join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lore_engine_filtered_relationships_${filterType.toLowerCase()}.csv`;
    a.click();
  };

  // Export JSON using CURRENTLY FILTERED dataset
  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredRelationships, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lore_engine_filtered_relationships_${filterType.toLowerCase()}.json`;
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
              disabled={loading || totalFiltered === 0}
              aria-label="Export filtered relationships to CSV"
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <Download size={14} /> Export Filtered CSV ({totalFiltered})
            </button>
            <button
              onClick={handleExportJSON}
              disabled={loading || totalFiltered === 0}
              aria-label="Export filtered relationships to JSON"
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs font-mono text-amber-300 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <FileText size={14} /> Export Filtered JSON ({totalFiltered})
            </button>
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
              onClick={loadData}
              className="flex items-center gap-1 px-3 py-1 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-lg font-mono text-[11px]"
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          {/* Relation Type Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {RELATION_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                aria-label={`Filter relationships by ${t}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  filterType === t
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                    : "bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search Entity A & B */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Entity A or B..."
              aria-label="Search Entity A or B"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
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
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No relationships found matching filter: <span className="text-amber-300">"{filterType}"</span> {search && `& search: "${search}"`}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
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

          {/* Pagination & Count Summary Footer */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono text-slate-400">
            <span>
              Showing <strong className="text-slate-200">{startCount} - {endCount}</strong> of <strong className="text-amber-300">{totalFiltered}</strong> relationships
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                aria-label="Previous Page"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Page <strong className="text-slate-200">{currentPage}</strong> of <strong className="text-slate-200">{totalPages}</strong></span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                aria-label="Next Page"
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
