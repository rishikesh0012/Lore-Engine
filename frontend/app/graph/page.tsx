"use client";

import { useEffect, useState } from "react";
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

export default function InteractiveGraphPage() {
  const [activeTab, setActiveTab] = useState<"Hesiod" | "Homer" | "Ovid" | "Overlap" | "Conflicts">("Hesiod");
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
              Graph Canvas
            </span>
          </div>
        </div>

        {/* Center: Tabs */}
        <div className="flex items-center gap-1 bg-[#0D0B14] p-1 rounded-full border border-purple-500/20 font-mono text-xs">
          {(["Hesiod", "Homer", "Ovid", "Overlap", "Conflicts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full transition-all ${
                activeTab === tab
                  ? "bg-[#7A5FB0] text-white shadow-lg font-semibold"
                  : "text-[#9C93A8] hover:text-[#EDE6D6]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right: Path Highlight Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHighlightPath(!highlightPath)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
              highlightPath
                ? "bg-[#D4A344] text-[#0D0B14] font-bold shadow-md shadow-[#D4A344]/20"
                : "bg-purple-950/60 border border-purple-500/30 text-[#D4A344] hover:bg-purple-900/40"
            }`}
          >
            <Sparkles size={14} />
            <span>{highlightPath ? "Path Highlighted" : "Highlight Shortest Path"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Key Figures Panel */}
        <aside className="w-72 bg-[#17131F]/80 border-r border-purple-500/20 flex flex-col p-4 z-20 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-sm font-bold text-[#D4A344] uppercase tracking-wider flex items-center gap-2">
              <Users size={16} /> Key Figures
            </h2>
            <span className="text-[10px] font-mono text-[#9C93A8]">{filteredNodes.length} figures</span>
          </div>

          {/* Quick Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C93A8]" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search figures..."
              className="w-full bg-[#0D0B14] border border-purple-500/20 rounded-xl py-2 pl-9 pr-3 text-xs text-[#EDE6D6] placeholder:text-[#9C93A8]/50 focus:outline-none focus:border-[#D4A344]/50 font-mono"
            />
          </div>

          {/* Key Figures List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-purple-900">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-900/60 to-slate-900 border border-[#D4A344]/50 shadow-md shadow-purple-950"
                      : "bg-[#1C1830]/60 border border-purple-500/10 hover:border-purple-500/30 hover:bg-[#1C1830]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-sm">
                      {node.avatar}
                    </div>
                    <div>
                      <h3 className={`text-xs font-semibold ${isSelected ? "text-[#D4A344]" : "text-[#EDE6D6]"}`}>
                        {node.name}
                      </h3>
                      <p className="text-[10px] text-[#9C93A8] line-clamp-1">{node.tradition}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#D4A344] font-bold bg-purple-950 px-2 py-0.5 rounded border border-purple-500/20">
                    {node.val}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center Canvas: Interactive Graph */}
        <main className="flex-1 bg-[#09070F] relative overflow-hidden flex items-center justify-center">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-950/20 rounded-full blur-[140px]" />
          </div>

          {/* Interactive Graph SVG Canvas */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <svg className="w-full h-full">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#7A5FB0" />
                </marker>
              </defs>

              {/* Graph Edges */}
              {MOCK_GRAPH_LINKS.map((link, idx) => {
                const isSelectedEdge = link.source === selectedNode.id || link.target === selectedNode.id;
                const srcNodeIdx = MOCK_GRAPH_NODES.findIndex((n) => n.id === link.source);
                const tgtNodeIdx = MOCK_GRAPH_NODES.findIndex((n) => n.id === link.target);

                const x1 = 220 + (srcNodeIdx % 4) * 230;
                const y1 = 160 + Math.floor(srcNodeIdx / 4) * 180;
                const x2 = 220 + (tgtNodeIdx % 4) * 230;
                const y2 = 160 + Math.floor(tgtNodeIdx / 4) * 180;

                return (
                  <g key={idx}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={
                        link.relation === "OPPOSES"
                          ? "#C1443C"
                          : link.relation === "PARENT_OF"
                          ? "#3B82F6"
                          : "#10B981"
                      }
                      strokeWidth={isSelectedEdge ? "3" : "1.5"}
                      strokeDasharray={link.relation === "OPPOSES" ? "4,4" : "none"}
                      opacity={isSelectedEdge ? 1 : 0.4}
                      markerEnd="url(#arrow)"
                      className="transition-all duration-300"
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 8}
                      fill={isSelectedEdge ? "#D4A344" : "#9C93A8"}
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="font-bold"
                    >
                      {link.relation}
                    </text>
                  </g>
                );
              })}

              {/* Graph Nodes */}
              {MOCK_GRAPH_NODES.map((node, idx) => {
                const isSelected = selectedNode.id === node.id;
                const cx = 220 + (idx % 4) * 230;
                const cy = 160 + Math.floor(idx / 4) * 180;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${cx}, ${cy})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    <circle
                      r={isSelected ? 28 : 22}
                      fill={isSelected ? "#7A5FB0" : "#1C1830"}
                      stroke={isSelected ? "#D4A344" : "#7A5FB0"}
                      strokeWidth={isSelected ? "3" : "1.5"}
                      className="transition-all duration-300 group-hover:scale-110 drop-shadow-xl"
                    />
                    <text
                      textAnchor="middle"
                      dy="4"
                      fill="#EDE6D6"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {node.avatar}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="44"
                      fill={isSelected ? "#D4A344" : "#EDE6D6"}
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="serif"
                      className="tracking-wide"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Controls Bar Overlay */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-[#17131F]/90 border border-purple-500/20 p-2 rounded-2xl backdrop-blur-md shadow-2xl">
            <button className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-[#D4A344] transition-colors">
              <ZoomIn size={16} />
            </button>
            <button className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-[#D4A344] transition-colors">
              <ZoomOut size={16} />
            </button>
            <button className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-[#D4A344] transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
        </main>

        {/* Right Sidebar: Node Details Panel */}
        <aside className="w-80 bg-[#17131F]/80 border-l border-purple-500/20 flex flex-col p-5 z-20 backdrop-blur-md justify-between">
          <div className="space-y-6">
            {/* Selected Node Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-purple-500/20">
              <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border border-[#D4A344]/40 flex items-center justify-center text-2xl shadow-xl">
                {selectedNode.avatar}
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#D4A344]">
                  {selectedNode.name}
                </h2>
                <p className="text-xs text-[#9C93A8]">{selectedNode.tradition}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/characters`}>
                <button className="w-full py-2.5 px-3 bg-[#7A5FB0] hover:bg-[#684E9C] text-white font-medium text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5">
                  <Sparkles size={14} /> Profile
                </button>
              </Link>
              <Link href={`/compare`}>
                <button className="w-full py-2.5 px-3 bg-purple-950/80 border border-purple-500/30 hover:bg-purple-900/60 text-[#D4A344] font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5">
                  <GitCommit size={14} /> Compare
                </button>
              </Link>
            </div>

            {/* Known Relationships Section */}
            <div className="space-y-3">
              <h3 className="font-serif text-xs font-bold text-[#D4A344] uppercase tracking-wider">
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
            <span>Graph Status: Healthy</span>
            <span className="text-emerald-400">Neo4j Bolt Live</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
