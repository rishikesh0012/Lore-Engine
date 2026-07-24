"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  GitCommit, 
  Users, 
  ShieldAlert, 
  ArrowUpRight, 
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Route,
  User,
  GitCompare
} from "lucide-react";
import { getApiBaseUrl, fetchGraph } from "@/lib/api";

interface Node {
  id: string;
  label: string;
  group: string;
  val: number;
}

interface LinkItem {
  id?: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
  sourceDoc: string;
}

function GraphContent() {
  const searchParams = useSearchParams();
  const sourceParam = searchParams?.get("source")?.toLowerCase() || "";
  const initialEntityParam = searchParams?.get("entity") || "";

  const getInitialTab = (): "Hesiod" | "Homer" | "Ovid" | "Overlap" | "Conflicts" => {
    if (sourceParam.includes("hesiod")) return "Hesiod";
    if (sourceParam.includes("homer") || sourceParam.includes("iliad") || sourceParam.includes("odyssey")) return "Homer";
    if (sourceParam.includes("ovid") || sourceParam.includes("metamorphoses")) return "Ovid";
    if (sourceParam.includes("overlap")) return "Overlap";
    if (sourceParam.includes("conflict")) return "Conflicts";
    return "Hesiod";
  };

  const [activeTab, setActiveTab] = useState<"Hesiod" | "Homer" | "Ovid" | "Overlap" | "Conflicts">(getInitialTab);
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: LinkItem[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialEntityParam);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Shortest Path Mode State
  const [pathMode, setPathMode] = useState(false);
  const [startEntity, setStartEntity] = useState<string>("");
  const [targetEntity, setTargetEntity] = useState<string>("");
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [pathDistance, setPathDistance] = useState<number | null>(null);

  // Fetch Graph Data based on activeTab
  useEffect(() => {
    setLoading(true);
    const sourceQuery = activeTab.toLowerCase();
    
    fetchGraph(sourceQuery)
      .then((data) => {
        const nodes = data.nodes || [];
        const links = data.links || [];
        setGraphData({ nodes, links });
        console.log(`[Graph View] Switched to tab ${activeTab}: ${nodes.length} nodes, ${links.length} edges`);
        
        if (nodes.length > 0) {
          const matched = initialEntityParam 
            ? nodes.find((n: Node) => n.label.toLowerCase() === initialEntityParam.toLowerCase()) || nodes[0]
            : nodes[0];
          setSelectedNode(matched);
        } else {
          setSelectedNode(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load graph data", err);
        setLoading(false);
      });
  }, [activeTab, initialEntityParam]);

  // Execute Shortest Path Traversal
  const handleFindPath = () => {
    if (!startEntity || !targetEntity) return;
    
    fetch(`${getApiBaseUrl()}/path?start=${encodeURIComponent(startEntity)}&target=${encodeURIComponent(targetEntity)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.path && Array.isArray(data.path)) {
          setHighlightedPath(data.path);
          setPathDistance(data.distance);
          console.log(`[Shortest Path Result] Path: ${data.path.join(" -> ")}, Distance: ${data.distance}`);
        }
      })
      .catch((err) => console.error("Failed to compute shortest path", err));
  };

  const filteredNodes = graphData.nodes.filter((n) =>
    searchQuery ? n.label.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const selectedNodeRels = selectedNode
    ? graphData.links.filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
    : [];

  return (
    <div className="h-screen w-screen bg-[#0D0B14] text-[#EDE6D6] flex flex-col font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-[#17131F]/90 border-b border-purple-500/20 px-6 flex items-center justify-between z-30 backdrop-blur-md">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-mono text-[#D4A344] hover:bg-purple-900/40 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-lg font-bold text-[#D4A344] tracking-wider uppercase">
              Lore Engine
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/20">
              Interactive Explorer
            </span>
          </div>
        </div>

        {/* Center Tabs - Source Filtering */}
        <div className="flex items-center gap-1 bg-[#0D0B14]/80 p-1 rounded-xl border border-purple-500/20">
          {(["Hesiod", "Homer", "Ovid", "Overlap", "Conflicts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-label={`Filter graph by ${tab} source`}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeTab === tab
                  ? "bg-purple-600/30 text-[#D4A344] border border-[#D4A344]/40 font-bold shadow-md"
                  : "text-[#9C93A8] hover:text-[#EDE6D6] hover:bg-purple-950/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Search & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C93A8]" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find entity..."
              aria-label="Search graph entities"
              className="w-full bg-[#0D0B14] border border-purple-500/30 rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#EDE6D6] focus:outline-none focus:border-[#D4A344]"
            />
          </div>

          <button
            onClick={() => setPathMode(!pathMode)}
            aria-label="Toggle shortest path finder"
            title="Shortest Path Finder"
            className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
              pathMode ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-[#0D0B14] border-purple-500/30 text-[#9C93A8] hover:text-[#EDE6D6]"
            }`}
          >
            <Route size={16} />
          </button>
        </div>
      </header>

      {/* Shortest Path Overlay Bar */}
      {pathMode && (
        <div className="bg-[#17131F] border-b border-purple-500/30 px-6 py-3 flex items-center justify-between gap-4 z-20 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold flex items-center gap-1.5">
              <Route size={14} /> Shortest Path Finder:
            </span>
            <select
              value={startEntity}
              onChange={(e) => setStartEntity(e.target.value)}
              aria-label="Select start entity"
              className="bg-[#0D0B14] border border-purple-500/30 rounded-lg px-2.5 py-1 text-xs text-[#EDE6D6]"
            >
              <option value="">-- Select Start Entity --</option>
              {graphData.nodes.map((n) => (
                <option key={n.id} value={n.label}>{n.label}</option>
              ))}
            </select>
            <span className="text-slate-400">➔</span>
            <select
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value)}
              aria-label="Select target entity"
              className="bg-[#0D0B14] border border-purple-500/30 rounded-lg px-2.5 py-1 text-xs text-[#EDE6D6]"
            >
              <option value="">-- Select Target Entity --</option>
              {graphData.nodes.map((n) => (
                <option key={n.id} value={n.label}>{n.label}</option>
              ))}
            </select>
            <button
              onClick={handleFindPath}
              disabled={!startEntity || !targetEntity}
              aria-label="Compute shortest graph path"
              className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              Compute Path
            </button>
          </div>

          {highlightedPath.length > 0 && (
            <div className="text-emerald-400 font-bold">
              Path: {highlightedPath.join(" ➔ ")} (Distance: {pathDistance} hops)
            </div>
          )}
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive Graph Canvas Area */}
        <main className="flex-1 relative bg-gradient-to-b from-[#0D0B14] via-[#130F21] to-[#0D0B14] flex items-center justify-center p-8 overflow-hidden">
          {/* Radial Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#3B2D54_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

          {/* Canvas Floating Controls (Zoom In, Zoom Out, Reset View) */}
          <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.0))}
              aria-label="Zoom In Graph"
              title="Zoom In"
              className="p-2.5 rounded-xl bg-[#17131F]/90 border border-purple-500/30 text-[#EDE6D6] hover:bg-purple-900/40 hover:border-amber-400/50 transition-colors shadow-lg"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.5))}
              aria-label="Zoom Out Graph"
              title="Zoom Out"
              className="p-2.5 rounded-xl bg-[#17131F]/90 border border-purple-500/30 text-[#EDE6D6] hover:bg-purple-900/40 hover:border-amber-400/50 transition-colors shadow-lg"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={() => { setZoomLevel(1); setSearchQuery(""); setHighlightedPath([]); }}
              aria-label="Reset Graph View"
              title="Reset View"
              className="p-2.5 rounded-xl bg-[#17131F]/90 border border-purple-500/30 text-[#EDE6D6] hover:bg-purple-900/40 hover:border-amber-400/50 transition-colors shadow-lg"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Graph Nodes Visual Representation */}
          {loading ? (
            <div className="text-amber-400 font-mono text-xs animate-pulse">Loading Source Graph...</div>
          ) : (
            <div
              className="relative w-full h-full max-w-4xl max-h-[600px] flex items-center justify-center transition-transform duration-300"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {filteredNodes.map((node, i) => {
                const isSelected = selectedNode?.id === node.id;
                const isHighlighted = highlightedPath.includes(node.label);
                const angle = (i / filteredNodes.length) * 2 * Math.PI;
                const radius = 220;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    aria-label={`Select character ${node.label}`}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className={`absolute group p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col items-center gap-1.5 shadow-2xl ${
                      isSelected
                        ? "bg-amber-500/20 border-[#D4A344] scale-110 z-20 shadow-amber-500/20"
                        : isHighlighted
                        ? "bg-emerald-500/20 border-emerald-400 scale-105 z-15"
                        : "bg-[#17131F]/90 border-purple-500/30 hover:border-purple-400 hover:scale-105 z-10"
                    }`}
                  >
                    <span className="font-serif font-bold text-xs text-[#EDE6D6] tracking-wide">
                      {node.label}
                    </span>
                    <span className="text-[9px] font-mono text-[#D4A344] px-1.5 py-0.5 rounded bg-purple-950/60">
                      {node.val} links
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* Right Entity Details Sidebar */}
        <aside className="w-80 bg-[#17131F]/95 border-l border-purple-500/20 p-6 flex flex-col justify-between z-20 backdrop-blur-md">
          {selectedNode ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
                <div>
                  <h2 className="font-serif text-xl font-bold text-[#D4A344]">
                    {selectedNode.label}
                  </h2>
                  <p className="text-xs font-mono text-[#9C93A8]">{selectedNode.group}</p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/characters/${selectedNode.id.toLowerCase()}`}
                    aria-label={`View full profile for ${selectedNode.label}`}
                    title="View Character Profile"
                    className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition-colors"
                  >
                    <User size={16} />
                  </Link>
                  <Link
                    href={`/compare?entity=${selectedNode.id.toLowerCase()}`}
                    aria-label={`Compare ${selectedNode.label} with other figures`}
                    title="Compare Character"
                    className="p-2 rounded-xl bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600/30 transition-colors"
                  >
                    <GitCompare size={16} />
                  </Link>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-purple-300">
                  Known Relationships ({selectedNodeRels.length})
                </h3>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
                  {selectedNodeRels.map((rel, idx) => {
                    const targetName = rel.source === selectedNode.id ? rel.target : rel.source;
                    const isOpposes = rel.label === "OPPOSES";

                    return (
                      <div
                        key={idx}
                        className="p-3 bg-[#0D0B14]/80 border border-purple-500/20 rounded-xl space-y-1.5"
                      >
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#EDE6D6] font-bold capitalize">{targetName}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isOpposes
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {rel.label}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#9C93A8]">
                          <span>{rel.sourceDoc}</span>
                          <span className="text-emerald-400 font-bold">{(rel.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-[#9C93A8] font-mono py-12">
              Select a node to inspect relationships.
            </div>
          )}

          {/* Graph Status Footer */}
          <div className="pt-4 border-t border-purple-500/20 text-[10px] font-mono text-[#9C93A8] flex justify-between items-center">
            <span>Source: {activeTab} ({graphData.nodes.length} N / {graphData.links.length} E)</span>
            <span className="text-emerald-400">Live API</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function InteractiveGraphPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#0D0B14] flex items-center justify-center text-amber-400 font-mono text-xs">Loading Knowledge Graph...</div>}>
      <GraphContent />
    </Suspense>
  );
}
