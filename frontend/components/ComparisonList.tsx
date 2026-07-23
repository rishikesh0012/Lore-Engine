import { useState, useEffect } from "react";
import { Filter, Loader2, AlertTriangle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import MiniGraph from "./MiniGraph";
import { getApiBaseUrl } from "@/lib/api";

interface ComparisonListProps {
  mode: "Overlap" | "Conflicts";
  onEntityClick: (label: string) => void;
  graphData: { nodes: any[], links: any[] };
}

export default function ComparisonList({ mode, onEntityClick, graphData }: ComparisonListProps) {
  const [filterType, setFilterType] = useState<"All" | "Character" | "Event" | "Location">("All");
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    
    const endpoint = mode === "Conflicts" 
      ? `${getApiBaseUrl()}/most-contested?limit=50`
      : `${getApiBaseUrl()}/key-figures?source=&limit=50`;  

    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setItems(data);
        } else {
          setItems([]);
        }
      })
      .catch(err => console.error(`Failed to load data for ${mode}`, err))
      .finally(() => setIsLoading(false));
  }, [mode]);

  const filteredItems = items;

  return (
    <div className="absolute inset-0 bg-myth-bg-dark/95 backdrop-blur-md flex flex-col p-8 overflow-hidden z-0">
      
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full">
        <header className="flex justify-between items-end mb-8 border-b border-myth-accent-gold/20 pb-4">
          <div>
            <h2 className="font-cormorant text-4xl text-myth-accent-gold">
              {mode === "Conflicts" ? "Recent Contradictions" : "Graph Overlap"}
            </h2>
            <p className="text-myth-text-secondary mt-2 font-light">
              {mode === "Conflicts" 
                ? "Entities with conflicting structural claims across different ancient sources." 
                : "The most interconnected entities bridging multiple mythological texts."}
            </p>
          </div>

          <div className="flex gap-2 bg-myth-card border border-myth-accent-gold/10 p-1 rounded-lg">
            <Filter size={16} className="text-myth-text-secondary self-center ml-2" />
            {["All", "Character", "Event", "Location"].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t as any)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${filterType === t ? 'bg-myth-accent-gold/20 text-myth-accent-gold' : 'text-myth-text-secondary hover:text-myth-text-primary'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={32} className="animate-spin text-myth-accent-gold" />
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const isExpanded = expandedItem === item.character;
              return (
                <div 
                  key={idx} 
                  className={`bg-myth-card border ${isExpanded ? 'border-myth-accent-gold/50 shadow-lg' : 'border-myth-accent-gold/10 hover:border-myth-accent-gold/30'} p-4 rounded-xl transition-all group flex flex-col`}
                >
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedItem(isExpanded ? null : item.character)}>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-myth-accent-gold/10 flex items-center justify-center text-myth-accent-gold font-jetbrains text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-cormorant text-2xl text-myth-text-primary group-hover:text-myth-accent-gold transition-colors flex items-center gap-2">
                          {item.character}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEntityClick(item.character); }}
                            className="text-[10px] bg-myth-accent-violet/20 text-myth-accent-violet px-2 py-1 rounded font-sans uppercase tracking-widest hover:bg-myth-accent-violet hover:text-white transition-colors"
                          >
                            Open Panel
                          </button>
                        </h3>
                        <div className="text-xs font-jetbrains uppercase tracking-widest text-myth-text-secondary mt-1">
                          {mode === "Conflicts" ? `${item.contradictions} Contradictions` : `${item.degree} Global Connections`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {mode === "Conflicts" && (
                        <AlertTriangle className="text-myth-accent-violet opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
                      )}
                      {mode === "Overlap" && (
                        <ExternalLink className="text-myth-text-secondary opacity-50 group-hover:opacity-100 transition-opacity" size={20} />
                      )}
                      {isExpanded ? <ChevronUp size={20} className="text-myth-text-secondary" /> : <ChevronDown size={20} className="text-myth-text-secondary" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <MiniGraph 
                      entityLabel={item.character} 
                      isConflictMode={mode === "Conflicts"} 
                    />
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-myth-text-secondary/50 italic border border-dashed border-myth-text-secondary/20 rounded-xl p-6 text-center">
              <p className="text-lg text-myth-accent-violet/70 mb-2">
                {mode === "Conflicts" ? "The Cosmos is at Peace" : "The Void is Empty"}
              </p>
              <p className="text-sm">
                {mode === "Conflicts" 
                  ? "No structural contradictions have been detected between ancient sources yet. Run the extraction pipeline on more texts to find conflicts." 
                  : "No interconnected entities were found. The graph may be empty."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
