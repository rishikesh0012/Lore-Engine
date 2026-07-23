"use client";

import { useEffect, useState, Suspense } from "react";
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
  AlertTriangle
} from "lucide-react";

interface Node {
  id: string;
  name: string;
  tradition: string;
  val: number;
  avatar: string;
}

interface LinkItem {
  source: string;
  target: string;
  relation: string;
  confidence: number;
  sourceDoc: string;
}

const MOCK_GRAPH_NODES: Node[] = [
  { id: "zeus", name: "Zeus", tradition: "Hesiod / Homer / Ovid", val: 42, avatar: "⚡" },
  { id: "athena", name: "Athena", tradition: "Homer / Ovid", val: 38, avatar: "🦉" },
  { id: "odysseus", name: "Odysseus", tradition: "Homer", val: 31, avatar: "⛵" },
  { id: "poseidon", name: "Poseidon", tradition: "Hesiod / Homer", val: 29, avatar: "🌊" },
  { id: "apollo", name: "Apollo", tradition: "Hesiod / Homer", val: 33, avatar: "☀️" },
  { id: "hera", name: "Hera", tradition: "Hesiod / Homer", val: 24, avatar: "👑" },
  { id: "cronos", name: "Cronos", tradition: "Hesiod / Ovid", val: 16, avatar: "⏳" },
  { id: "ares", name: "Ares", tradition: "Homer", val: 19, avatar: "⚔️" },
];

const MOCK_GRAPH_LINKS: LinkItem[] = [
  { source: "zeus", target: "athena", relation: "PARENT_OF", confidence: 1.0, sourceDoc: "Hesiod's Theogony" },
  { source: "zeus", target: "hera", relation: "MARRIED_TO", confidence: 1.0, sourceDoc: "Hesiod's Theogony" },
  { source: "zeus", target: "apollo", relation: "PARENT_OF", confidence: 0.95, sourceDoc: "Homer's Iliad" },
  { source: "poseidon", target: "odysseus", relation: "OPPOSES", confidence: 0.98, sourceDoc: "Homer's Odyssey" },
  { source: "athena", target: "odysseus", relation: "ALLIES_WITH", confidence: 0.99, sourceDoc: "Homer's Odyssey" },
  { source: "cronos", target: "zeus", relation: "PARENT_OF", confidence: 1.0, sourceDoc: "Hesiod's Theogony" },
  { source: "athena", target: "ares", relation: "OPPOSES", confidence: 0.95, sourceDoc: "Homer's Iliad" },
];

function GraphContent() {
  const searchParams = useSearchParams();
  const sourceParam = searchParams?.get("source")?.toLowerCase() || "";

  const getInitialTab = (): "Hesiod" | "Homer" | "Ovid" | "Overlap" | "Conflicts" => {
    if (sourceParam.includes("hesiod")) return "Hesiod";
    if (sourceParam.includes("homer") || sourceParam.includes("iliad") || sourceParam.includes("odyssey")) return "Homer";
    if (sourceParam.includes("ovid") || sourceParam.includes("metamorphoses")) return "Ovid";
    if (sourceParam.includes("overlap")) return "Overlap";
    if (sourceParam.includes("conflict")) return "Conflicts";
    return "Hesiod";
  };

  const [activeTab, setActiveTab] = useState<"Hesiod" | "Homer" | "Ovid" | "Overlap" | "Conflicts">(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [sourceParam]);

  const [selectedNode, setSelectedNode] = useState<Node>(MOCK_GRAPH_NODES[0]);
  const [highlightPath, setHighlightPath] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = MOCK_GRAPH_NODES.filter((n) =>
    searchQuery ? n.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const selectedNodeRels = MOCK_GRAPH_LINKS.filter(
    (l) => l.source === selectedNode.id || l.target === selectedNode.id
  );

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

        {/* Center Tabs */}
        <div className="flex items-center gap-1 bg-[#0D0B14]/80 p-1 rounded-xl border border-purple-500/20">
          {(["Hesiod", "Homer", "Ovid", "Overlap", "Conflicts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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

        {/* Right Search & Controls */}
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C93A8]" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find entity..."
              className="w-full bg-[#0D0B14] border border-purple-500/30 rounded-lg py-1.5 pl-8 pr-3 text-xs text-[#EDE6D6] focus:outline-none focus:border-[#D4A344]"
            />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive Graph Canvas Area */}
        <main className="flex-1 relative bg-gradient-to-b from-[#0D0B14] via-[#130F21] to-[#0D0B14] flex items-center justify-center p-8 overflow-hidden">
          {/* Radial Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#3B2D54_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

          {/* Graph Nodes Visual Representation */}
          <div className="relative w-full h-full max-w-4xl max-h-[600px] flex items-center justify-center">
            {filteredNodes.map((node, i) => {
              const isSelected = selectedNode.id === node.id;
              const angle = (i / filteredNodes.length) * 2 * Math.PI;
              const radius = 220;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  className={`absolute group p-4 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col items-center gap-1.5 shadow-2xl ${
                    isSelected
                      ? "bg-amber-500/20 border-[#D4A344] scale-110 z-20 shadow-amber-500/20"
                      : "bg-[#17131F]/90 border-purple-500/30 hover:border-purple-400 hover:scale-105 z-10"
                  }`}
                >
                  <span className="text-2xl">{node.avatar}</span>
                  <span className="font-serif font-bold text-xs text-[#EDE6D6] tracking-wide">
                    {node.name}
                  </span>
                  <span className="text-[9px] font-mono text-[#D4A344] px-1.5 py-0.5 rounded bg-purple-950/60">
                    {node.val} connections
                  </span>
                </button>
              );
            })}
          </div>
        </main>

        {/* Right Entity Details Sidebar */}
        <aside className="w-80 bg-[#17131F]/95 border-l border-purple-500/20 p-6 flex flex-col justify-between z-20 backdrop-blur-md">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-purple-500/20">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl">
                {selectedNode.avatar}
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#D4A344]">
                  {selectedNode.name}
                </h2>
                <p className="text-xs font-mono text-[#9C93A8]">{selectedNode.tradition}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-purple-300">
                Known Relationships ({selectedNodeRels.length})
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 font-mono text-xs">
                {selectedNodeRels.map((rel, idx) => {
                  const targetName = rel.source === selectedNode.id ? rel.target : rel.source;
                  const isOpposes = rel.relation === "OPPOSES";

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
                          {rel.relation}
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

          {/* Graph Status Footer */}
          <div className="pt-4 border-t border-purple-500/20 text-[10px] font-mono text-[#9C93A8] flex justify-between items-center">
            <span>Active View: {activeTab}</span>
            <span className="text-emerald-400">Neo4j Bolt Live</span>
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
