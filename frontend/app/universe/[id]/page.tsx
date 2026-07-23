"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Route, GitCompare } from "lucide-react";
import GraphView from "@/components/GraphView";
import KeyFigures from "@/components/KeyFigures";
import EntityPanel from "@/components/EntityPanel";
import ComparisonList from "@/components/ComparisonList";
import FloatingChatWidget from "@/components/FloatingChatWidget";

const TABS = [
  { id: "Hesiod_Theogony", label: "Hesiod" },
  { id: "Homer_Iliad", label: "Homer" },
  { id: "Ovid_Metamorphoses", label: "Ovid" },
  { id: "Overlap", label: "Overlap" },
  { id: "Conflicts", label: "Conflicts" }
];

export default function UniversePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [compareNode, setCompareNode] = useState<any | null>(null);
  
  // UI states
  const [compareMode, setCompareMode] = useState(false);
  const [pathMode, setPathMode] = useState(false);
  
  // Panel states
  const [profileData, setProfileData] = useState<string | null>(null);
  const [rawProfileData, setRawProfileData] = useState<any | null>(null);
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [rawCompareData, setRawCompareData] = useState<any | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const sourceParam = id === "Overlap" ? "" : `?source=${id}`;
        const res = await fetch(`http://localhost:8002/api/graph${sourceParam}`);
        const data = await res.json();
        setGraphData(data);
      } catch (err) {
        console.error("Failed to load graph data", err);
      }
    };
    fetchGraph();
  }, [id]);

  const handleNodeClick = (node: any) => {
    if (compareMode || pathMode) {
      if (!selectedNode) {
        setSelectedNode(node);
      } else if (selectedNode.id !== node.id && !compareNode) {
        setCompareNode(node);
        if (compareMode) {
          generateRawComparison(selectedNode, node);
        }
      } else {
        // Reset selection if clicking a third node
        setSelectedNode(node);
        setCompareNode(null);
        setCompareResult(null);
        setRawCompareData(null);
      }
    } else {
      setSelectedNode(node);
      setProfileData(null);
      setRawProfileData(null);
    }
  };

  const handleFigureClick = (nodeLabel: string) => {
    // Find the node in graph data to get full node object
    const node = graphData.nodes.find((n: any) => n.label === nodeLabel);
    if (node) {
      handleNodeClick(node);
    } else {
      // Fallback if node not in current view
      handleNodeClick({ id: nodeLabel, label: nodeLabel, type: "Character" });
    }
  };

  const generateRawProfile = async (label: string) => {
    setIsLoadingProfile(true);
    setProfileData(null);
    try {
      const source = (id !== "Overlap" && id !== "Conflicts") ? id : undefined;
      const res = await fetch(`http://localhost:8002/api/profile/raw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: label, source: source })
      });
      const data = await res.json();
      setRawProfileData(data);
    } catch (e) {
      setProfileData("Error fetching local data.");
    }
    setIsLoadingProfile(false);
  };

  const generateProfile = async (label: string) => {
    setIsSummarizing(true);
    try {
      const res = await fetch(`http://localhost:8002/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Provide a detailed mythological profile for ${label}. Focus on their origins, key myths, and relationships.` })
      });
      const data = await res.json();
      setProfileData(data.answer);
    } catch (e) {
      setProfileData("Error communicating with the Oracle.");
    }
    setIsSummarizing(false);
  };

  const generateRawComparison = async (nodeA: any, nodeB: any) => {
    setIsLoadingCompare(true);
    setCompareResult(null);
    try {
      const source = (id !== "Overlap" && id !== "Conflicts") ? id : undefined;
      const res = await fetch(`http://localhost:8002/api/compare/raw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryA: nodeA.label, queryB: nodeB.label, source: source })
      });
      const data = await res.json();
      setRawCompareData(data);
    } catch (e) {
      setCompareResult("Error fetching local comparison.");
    }
    setIsLoadingCompare(false);
  };

  const generateComparison = async (nodeA: any, nodeB: any) => {
    setIsSummarizing(true);
    try {
      const res = await fetch(`http://localhost:8002/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Compare and contrast ${nodeA.label} and ${nodeB.label} in Greek mythology. What are their similarities, differences, and direct interactions?` })
      });
      const data = await res.json();
      setCompareResult(data.answer);
    } catch (e) {
      setCompareResult("Error communicating with the Oracle.");
    }
    setIsSummarizing(false);
  };

  return (
    <main className="w-screen h-screen overflow-hidden bg-myth-bg-dark relative flex flex-col">
      {/* Top Navigation */}
      <div className="h-16 border-b border-myth-accent-gold/20 flex items-center px-6 justify-between shrink-0 bg-myth-bg-dark/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-myth-text-secondary hover:text-myth-accent-gold flex items-center gap-2 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-jetbrains text-sm uppercase tracking-widest">Back</span>
          </Link>
          <div className="h-6 w-px bg-myth-accent-gold/20" />
          <h1 className="font-cormorant text-2xl text-myth-accent-gold tracking-wide">
            Lore Engine
          </h1>
        </div>

        {/* 5-Tab Layout */}
        <div className="flex space-x-1 p-1 bg-myth-bg-dark border border-myth-accent-gold/10 rounded-lg">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => router.push(`/universe/${tab.id}`)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                id === tab.id 
                  ? 'bg-myth-accent-gold/20 text-myth-accent-gold shadow-sm border border-myth-accent-gold/30' 
                  : 'text-myth-text-secondary hover:text-myth-text-primary hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPathMode(!pathMode);
              setCompareMode(false);
              setCompareNode(null);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition-colors ${
              pathMode 
                ? 'bg-myth-accent-gold/20 border-myth-accent-gold text-myth-accent-gold' 
                : 'border-myth-accent-gold/20 text-myth-text-secondary hover:text-myth-accent-gold'
            }`}
          >
            <Route size={16} />
            Path Highlight
          </button>
        </div>
      </div>

        {/* Main Content Area */}
      <div className="flex-1 relative w-full h-full">
        <GraphView 
          graphData={graphData} 
          selectedNode={selectedNode}
          compareNode={compareNode}
          onNodeClick={handleNodeClick}
          pathMode={pathMode}
        />
        
        {/* Render ComparisonList over GraphView if we are on Overlap or Conflicts tabs */}
        {(id === "Overlap" || id === "Conflicts") && (
          <ComparisonList mode={id as any} onEntityClick={handleFigureClick} graphData={graphData} />
        )}

        {/* Only show KeyFigures for sources, not for overlap/conflicts */}
        {id !== "Overlap" && id !== "Conflicts" && (
          <KeyFigures source={id} onFigureClick={handleFigureClick} />
        )}

        <EntityPanel 
          selectedNode={selectedNode}
          compareNode={compareNode}
          compareMode={compareMode}
          rawProfileData={rawProfileData}
          profileData={profileData}
          rawCompareData={rawCompareData}
          compareResult={compareResult}
          isLoadingProfile={isLoadingProfile}
          isSummarizing={isSummarizing}
          isLoadingCompare={isLoadingCompare}
          graphDataLinks={graphData.links}
          onClose={() => {
            setSelectedNode(null);
            setCompareNode(null);
            setCompareMode(false);
            setPathMode(false);
          }}
          onFetchProfile={generateRawProfile}
          onSummarizeProfile={generateProfile}
          onSummarizeCompare={generateComparison}
          onToggleCompare={() => {
            setCompareMode(!compareMode);
            setCompareNode(null);
            setRawCompareData(null);
            setCompareResult(null);
          }}
          onClearCompare={() => {
            setCompareNode(null);
            setCompareResult(null);
            setRawCompareData(null);
          }}
        />

        {/* Floating Chat Widget */}
        <FloatingChatWidget universeId={id} onEntityClick={handleFigureClick} />
      </div>
    </main>
  );
}
