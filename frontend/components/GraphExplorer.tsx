"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { X, ExternalLink, User, GitCompare, Loader2 } from "lucide-react";

export default function GraphExplorer() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const fgRef = useRef<any>(null);

  // Profile State
  const [profileData, setProfileData] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Compare State
  const [compareMode, setCompareMode] = useState(false);
  const [compareNode, setCompareNode] = useState<any | null>(null);
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [isLoadingCompare, setIsLoadingCompare] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8002/api/graph")
      .then(res => res.json())
      .then(data => setGraphData(data))
      .catch(err => console.error("Failed to load graph", err));
  }, []);

  const getNodeColor = (node: any) => {
    // Highlight nodes if they are selected or part of a comparison
    if (selectedNode && node.id === selectedNode.id) return "#E3C37A"; // Bright gold for selected
    if (compareNode && node.id === compareNode.id) return "#E3C37A"; 

    switch (node.type) {
      case "Character": return "#D4A344"; // Aged Gold
      case "Event": return "#7A5FB0";     // Muted Violet
      case "Location": return "#2A9D8F";  // Muted Teal
      default: return "#9C93A8";
    }
  };

  const fetchProfile = async (nodeLabel: string) => {
    setIsLoadingProfile(true);
    setProfileData(null);
    try {
      const res = await fetch("http://localhost:8002/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Provide a detailed narrative profile of ${nodeLabel}.` })
      });
      const data = await res.json();
      setProfileData(data.answer || "No profile available.");
    } catch (err) {
      setProfileData("Failed to load profile.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchComparison = async (node1: string, node2: string) => {
    setIsLoadingCompare(true);
    setCompareResult(null);
    try {
      const res = await fetch("http://localhost:8002/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Compare ${node1} and ${node2}. What are their similarities, differences, and any contradictions in Greek mythology?` })
      });
      const data = await res.json();
      setCompareResult(data.answer || "No comparison available.");
    } catch (err) {
      setCompareResult("Failed to load comparison.");
    } finally {
      setIsLoadingCompare(false);
    }
  };

  const handleNodeClick = useCallback((node: any) => {
    if (compareMode && selectedNode) {
      if (node.id === selectedNode.id) {
        // Cancel compare mode if clicking the same node
        setCompareMode(false);
        return;
      }
      setCompareNode(node);
      fetchComparison(selectedNode.label, node.label);
      setCompareMode(false);
    } else {
      setSelectedNode(node);
      setProfileData(null);
      setCompareNode(null);
      setCompareResult(null);
      setCompareMode(false);
    }
  }, [compareMode, selectedNode]);

  return (
    <div className="relative w-full h-screen bg-myth-bg-dark overflow-hidden font-sans">
      {/* Absolute Header for navigation */}
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none w-full flex justify-between">
        <h1 className="font-cormorant text-2xl font-medium text-myth-text-primary tracking-widest drop-shadow-md">
          THE UNIVERSE
        </h1>
        <a href="/oracle" className="pointer-events-auto text-sm font-sans px-4 py-2 bg-myth-card border border-myth-accent-gold/20 rounded-full hover:bg-myth-accent-gold/10 transition-colors">
          Consult Oracle
        </a>
      </div>

      {compareMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-myth-accent-violet/20 border border-myth-accent-violet/50 px-6 py-2 rounded-full backdrop-blur-md animate-pulse">
          Select another node on the graph to compare with {selectedNode?.label}
        </div>
      )}

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeColor={getNodeColor}
        nodeLabel="label"
        nodeRelSize={6}
        linkColor={(link: any) => link.isContradiction ? "#C1443C" : "rgba(122, 95, 176, 0.4)"}
        linkWidth={(link: any) => link.isContradiction ? 3 : 1}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={handleNodeClick}
        backgroundColor="#0D0B14" // Deep indigo dark
      />

      {/* Side Panel Drawer */}
      <div 
        className={`absolute top-0 right-0 h-full w-[400px] max-w-full bg-myth-card/95 backdrop-blur-xl border-l border-myth-accent-gold/20 shadow-2xl transition-transform duration-500 flex flex-col ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedNode && (
          <>
            <div className="p-6 border-b border-myth-accent-gold/10 flex justify-between items-start">
              <div>
                <span className="text-xs font-jetbrains text-myth-text-secondary uppercase tracking-widest">
                  {compareNode ? "Comparison" : selectedNode.type}
                </span>
                <h2 className="font-cormorant text-3xl font-medium mt-1 text-myth-accent-gold">
                  {compareNode ? `${selectedNode.label} vs ${compareNode.label}` : selectedNode.label}
                </h2>
              </div>
              <button onClick={() => {
                setSelectedNode(null);
                setCompareNode(null);
                setCompareMode(false);
              }} className="text-myth-text-secondary hover:text-myth-text-primary">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 font-sans flex flex-col gap-6">
              
              {/* Profile & Compare Controls (hidden when comparing) */}
              {!compareNode && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => fetchProfile(selectedNode.label)}
                    disabled={isLoadingProfile}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-myth-bg-dark border border-myth-accent-gold/30 rounded-lg hover:bg-myth-accent-gold/10 transition-colors text-sm"
                  >
                    {isLoadingProfile ? <Loader2 size={16} className="animate-spin" /> : <User size={16} />}
                    Generate Profile
                  </button>
                  <button 
                    onClick={() => setCompareMode(!compareMode)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg transition-colors text-sm ${compareMode ? 'bg-myth-accent-violet/20 border-myth-accent-violet/50' : 'bg-myth-bg-dark border-myth-accent-violet/30 hover:bg-myth-accent-violet/10'}`}
                  >
                    <GitCompare size={16} />
                    {compareMode ? "Cancel Compare" : "Compare"}
                  </button>
                </div>
              )}

              {/* Profile View */}
              {profileData && !compareNode && (
                <div className="bg-myth-bg-dark/50 p-4 rounded-xl border border-myth-accent-gold/10">
                  <h3 className="text-xs font-jetbrains text-myth-text-secondary mb-3 uppercase tracking-widest">Oracle Profile</h3>
                  <div className="text-sm text-myth-text-primary leading-relaxed whitespace-pre-wrap">
                    {profileData}
                  </div>
                </div>
              )}

              {/* Compare View */}
              {compareNode && (
                <div className="bg-myth-bg-dark/50 p-4 rounded-xl border border-myth-accent-violet/20">
                  <h3 className="text-xs font-jetbrains text-myth-accent-violet mb-3 uppercase tracking-widest">Comparative Analysis</h3>
                  {isLoadingCompare ? (
                    <div className="flex gap-2 items-center text-myth-accent-violet text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      Oracle is analyzing...
                    </div>
                  ) : (
                    <div className="text-sm text-myth-text-primary leading-relaxed whitespace-pre-wrap">
                      {compareResult}
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setCompareNode(null);
                      setCompareResult(null);
                    }}
                    className="mt-4 text-xs text-myth-text-secondary hover:text-myth-text-primary underline"
                  >
                    Clear Comparison
                  </button>
                </div>
              )}

              {/* Relationships List (Only show if not in comparison mode, to save space, or show always?) */}
              {!compareNode && (
                <div>
                  <h3 className="text-sm font-medium text-myth-text-secondary mb-4 tracking-wider uppercase">Known Relationships</h3>
                  <div className="flex flex-col gap-3">
                    {graphData.links.filter((l: any) => l.source.id === selectedNode.id || l.target.id === selectedNode.id).map((link: any, idx) => {
                      const isSource = link.source.id === selectedNode.id;
                      const otherNode = isSource ? link.target.label : link.source.label;
                      const direction = isSource ? "->" : "<-";
                      
                      return (
                        <div key={idx} className="bg-myth-bg-dark/30 p-3 rounded-lg border border-myth-accent-violet/10 text-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-myth-accent-violet text-xs tracking-wide uppercase">{link.type}</span>
                            <span className="text-myth-text-secondary">{direction} {otherNode}</span>
                          </div>
                          <div className="text-[11px] text-myth-text-secondary/50 flex items-center gap-1 mt-1 font-jetbrains">
                            <ExternalLink size={10} /> {link.sourceText || "Unknown Text"}
                          </div>
                        </div>
                      )
                    })}
                    {graphData.links.filter((l: any) => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length === 0 && (
                      <p className="text-sm text-myth-text-secondary italic">No relationships mapped yet.</p>
                    )}
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  );
}
