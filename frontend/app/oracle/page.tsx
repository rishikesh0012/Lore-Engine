"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Send, Map, BookOpen, AlertCircle } from "lucide-react";
import Starfield from "@/components/Starfield";

import dynamic from "next/dynamic";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

import { getApiBaseUrl } from "@/lib/api";

export default function Home() {
  const [contradictions, setContradictions] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userName = "Scholar";

  const containerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(600);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/contradictions`)
      .then(res => res.json())
      .then(data => setContradictions(data))
      .catch(err => console.error("Failed to fetch contradictions", err));
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setGraphWidth(containerRef.current.offsetWidth);
    }
  }, [graphData]);

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isLoading) return;
    
    setIsLoading(true);
    setAnswer(null);
    setGraphData(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setAnswer(data.answer || data.detail || "No answer received.");
      if (data.graph_data && data.graph_data.nodes && data.graph_data.nodes.length > 0) {
        setGraphData(data.graph_data);
      }
    } catch (err) {
      setAnswer("Error communicating with the Oracle.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center pb-12 overflow-x-hidden">
      <Starfield />

      {/* Top Bar */}
      <header className="w-full max-w-[900px] flex items-center justify-between p-6 z-10">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-myth-accent-gold">
            <circle cx="4" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="4" r="2" fill="currentColor" />
            <circle cx="20" cy="12" r="2" fill="currentColor" />
            <circle cx="12" cy="20" r="2" fill="currentColor" />
            <path d="M4 12L12 4L20 12L12 20Z" stroke="var(--color-myth-accent-violet)" strokeWidth="1" opacity="0.5"/>
          </svg>
          <h1 className="font-cormorant text-xl font-medium tracking-wide">Lore Engine</h1>
        </div>
        <div className="w-8 h-8 rounded-full bg-myth-card border border-myth-accent-gold/20 flex items-center justify-center font-cormorant text-sm">
          S
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-[900px] flex flex-col items-center mt-24 px-4 z-10 text-center">
        <h2 className="font-cormorant text-4xl md:text-5xl font-light mb-8">
          Good evening {userName}, <br />
          <span className="font-medium italic">which thread of the myth shall we pull?</span>
        </h2>

        {/* Input Bar */}
        <div className="w-full max-w-2xl bg-myth-card/80 backdrop-blur-md border border-myth-accent-gold/20 rounded-[2rem] p-2 flex flex-col shadow-[0_0_30px_rgba(212,163,68,0.05)] transition-all">
          <div className="flex items-center w-full px-4 py-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuery(e)}
              placeholder="Ask about a character, an event, or how two figures are connected..."
              className="flex-1 bg-transparent border-none outline-none text-myth-text-primary px-4 placeholder:text-myth-text-secondary/50 font-sans"
            />
            <button 
              onClick={handleQuery}
              disabled={isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#D4A344] to-[#E3C37A] text-myth-bg-dark shadow-[0_0_15px_rgba(212,163,68,0.4)] hover:scale-105 transition-transform disabled:opacity-50">
              <Send size={18} className="ml-1" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 border-t border-myth-accent-gold/10">
            <Link href="/" className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-myth-bg-dark/50 text-myth-accent-violet hover:bg-myth-accent-violet/10 transition-colors border border-myth-accent-violet/20">
              <Map size={14} /> Explore Graph
            </Link>
          </div>

          {/* Answer Area */}
          {(isLoading || answer) && (
            <div className="px-6 py-6 border-t border-myth-accent-gold/10 text-left font-sans bg-myth-bg-dark/30 rounded-b-[2rem]">
              {isLoading ? (
                <div className="flex gap-2 items-center text-myth-accent-gold">
                  <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span className="italic text-sm">The Oracle is consulting the archives...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className="text-myth-text-primary leading-relaxed whitespace-pre-wrap text-sm">
                    {answer}
                  </div>
                  {graphData && (
                    <div ref={containerRef} className="w-full h-[300px] border border-myth-accent-violet/20 rounded-xl overflow-hidden relative bg-[#0D0B14]">
                      <ForceGraph2D
                        graphData={graphData}
                        width={graphWidth}
                        height={300}
                        nodeLabel="label"
                        nodeRelSize={6}
                        nodeColor={(node: any) => node.type === "Character" ? "#D4A344" : "#7A5FB0"}
                        linkColor={() => "rgba(122, 95, 176, 0.4)"}
                        linkWidth={1.5}
                        linkDirectionalArrowLength={3.5}
                        linkDirectionalArrowRelPos={1}
                        backgroundColor="#0D0B14"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Cards Grid */}
      <section className="w-full max-w-[900px] grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 px-4 z-10">
        <div className="myth-card p-6 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer group">
          <BookOpen className="text-myth-accent-gold mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-cormorant text-xl font-semibold mb-2">Ask the Oracle</h3>
          <p className="text-sm text-myth-text-secondary leading-relaxed font-sans">
            Submit a query to the GraphRAG engine. It will traverse the cosmos of relationships and read the texts for you.
          </p>
        </div>

        <Link href="/" className="myth-card p-6 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer group">
          <Map className="text-myth-accent-violet mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-cormorant text-xl font-semibold mb-2">Explore the Pantheon</h3>
          <p className="text-sm text-myth-text-secondary leading-relaxed font-sans">
            Venture directly into the interactive graph. Trace the lineage of gods, heroes, and monsters.
          </p>
        </Link>

        <div className="myth-card p-6 flex flex-col hover:-translate-y-1 transition-transform cursor-pointer group border-myth-conflict/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-myth-conflict/5 rounded-bl-full pointer-events-none" />
          <AlertCircle className="text-myth-conflict mb-4 group-hover:scale-110 transition-transform" />
          <h3 className="font-cormorant text-xl font-semibold mb-2 text-myth-conflict/90">Recent Contradictions</h3>
          <p className="text-sm text-myth-text-secondary leading-relaxed font-sans mb-3 flex-1">
            {contradictions.length} recorded disagreements between ancient sources currently mapped.
          </p>
          {contradictions.length > 0 && (
            <div className="text-xs bg-myth-bg-dark/50 p-2 rounded border border-myth-conflict/10 text-myth-text-primary/80 truncate">
              Preview: {contradictions[0]?.entity} conflict...
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-[900px] mt-auto pt-16 px-4 z-10 flex flex-col items-center text-center">
        <p className="text-xs text-myth-text-secondary max-w-lg mb-4 font-jetbrains opacity-60">
          This tool cross-references public-domain mythological texts and may reflect genuine disagreements between ancient sources. Contradictions shown are between historical texts, not factual errors.
        </p>
        <div className="flex gap-4 text-xs text-myth-text-primary/60 font-sans">
          <a href="#" className="hover:text-myth-accent-gold transition-colors">About This Project</a>
          <span className="opacity-30">•</span>
          <a href="#" className="hover:text-myth-accent-gold transition-colors">How It Works</a>
          <span className="opacity-30">•</span>
          <a href="#" className="hover:text-myth-accent-gold transition-colors">Source Texts</a>
          <span className="opacity-30">•</span>
          <a href="#" className="hover:text-myth-accent-gold transition-colors">Feedback</a>
        </div>
      </footer>
    </main>
  );
}
