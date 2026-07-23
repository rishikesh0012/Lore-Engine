import { X, ExternalLink, User, GitCompare, Loader2, Sparkles } from "lucide-react";

interface EntityPanelProps {
  selectedNode: any;
  compareNode: any;
  compareMode: boolean;
  rawProfileData: any | null;
  profileData: string | null;
  rawCompareData: any | null;
  compareResult: string | null;
  isLoadingProfile: boolean;
  isSummarizing: boolean;
  isLoadingCompare: boolean;
  graphDataLinks: any[];
  onClose: () => void;
  onFetchProfile: (label: string) => void;
  onSummarizeProfile: (label: string) => void;
  onSummarizeCompare: (nodeA: any, nodeB: any) => void;
  onToggleCompare: () => void;
  onClearCompare: () => void;
}

export default function EntityPanel({
  selectedNode,
  compareNode,
  compareMode,
  rawProfileData,
  profileData,
  rawCompareData,
  compareResult,
  isLoadingProfile,
  isSummarizing,
  isLoadingCompare,
  graphDataLinks,
  onClose,
  onFetchProfile,
  onSummarizeProfile,
  onSummarizeCompare,
  onToggleCompare,
  onClearCompare
}: EntityPanelProps) {
  if (!selectedNode) return null;

  return (
    <div 
      className={`absolute top-0 right-0 h-full w-[400px] max-w-full bg-myth-card/95 backdrop-blur-xl border-l border-myth-accent-gold/20 shadow-2xl transition-transform duration-500 flex flex-col ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-6 border-b border-myth-accent-gold/10 flex justify-between items-start">
        <div>
          <span className="text-xs font-jetbrains text-myth-text-secondary uppercase tracking-widest">
            {compareNode ? "Comparison" : selectedNode.type}
          </span>
          <h2 className="font-cormorant text-3xl font-medium mt-1 text-myth-accent-gold">
            {compareNode ? `${selectedNode.label} vs ${compareNode.label}` : selectedNode.label}
          </h2>
        </div>
        <button onClick={onClose} className="text-myth-text-secondary hover:text-myth-text-primary">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 font-sans flex flex-col gap-6">
        
        {/* Profile & Compare Controls (hidden when comparing) */}
        {!compareNode && (
          <div className="flex gap-2">
            <button 
              onClick={() => onFetchProfile(selectedNode.label)}
              disabled={isLoadingProfile}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-myth-bg-dark border border-myth-accent-gold/30 rounded-lg hover:bg-myth-accent-gold/10 transition-colors text-sm text-myth-text-primary"
            >
              {isLoadingProfile ? <Loader2 size={16} className="animate-spin" /> : <User size={16} />}
              Generate Profile
            </button>
            <button 
              onClick={onToggleCompare}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg transition-colors text-sm text-myth-text-primary ${compareMode ? 'bg-myth-accent-violet/20 border-myth-accent-violet/50' : 'bg-myth-bg-dark border-myth-accent-violet/30 hover:bg-myth-accent-violet/10'}`}
            >
              <GitCompare size={16} />
              {compareMode ? "Cancel Compare" : "Compare"}
            </button>
          </div>
        )}

        {/* Raw Profile View */}
        {rawProfileData && !compareNode && (
          <div className="bg-myth-bg-dark/50 p-4 rounded-xl border border-myth-accent-gold/10 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-jetbrains text-myth-text-secondary mb-3 uppercase tracking-widest">Local Database Hits</h3>
              <div className="flex flex-col gap-3">
                {rawProfileData.passages && rawProfileData.passages.length > 0 ? (
                  rawProfileData.passages.map((p: any, i: number) => (
                    <div key={i} className="text-sm text-myth-text-primary leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="text-[10px] text-myth-accent-gold/70 mb-1 font-jetbrains">{p.source_document}</div>
                      "{p.chunk_text}"
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-myth-text-secondary italic">No text passages found.</div>
                )}
              </div>
            </div>

            {/* AI Summarize Button */}
            {!profileData && (
              <button 
                onClick={() => onSummarizeProfile(selectedNode.label)}
                disabled={isSummarizing}
                className="w-full flex items-center justify-center gap-2 py-2 bg-myth-accent-violet/10 border border-myth-accent-violet/30 rounded-lg hover:bg-myth-accent-violet/20 transition-colors text-sm text-myth-accent-violet mt-2"
              >
                {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Summarize with AI
              </button>
            )}
            
            {/* Profile View (AI Summarized) */}
            {profileData && (
              <div className="mt-2 p-4 bg-myth-accent-violet/10 rounded-lg border border-myth-accent-violet/30">
                <h3 className="text-xs font-jetbrains text-myth-accent-violet mb-3 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} /> AI Summary
                </h3>
                <div className="text-sm text-myth-text-primary leading-relaxed whitespace-pre-wrap">
                  {profileData}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compare View */}
        {compareNode && (
          <div className="bg-myth-bg-dark/50 p-4 rounded-xl border border-myth-accent-violet/20 flex flex-col gap-4">
            {isLoadingCompare && !rawCompareData ? (
              <div className="flex gap-2 items-center text-myth-accent-violet text-sm">
                <Loader2 size={16} className="animate-spin" />
                Retrieving local context...
              </div>
            ) : null}

            {rawCompareData && !compareResult && (
              <div>
                <h3 className="text-xs font-jetbrains text-myth-text-secondary mb-3 uppercase tracking-widest">Local Database Overlap</h3>
                <div className="flex flex-col gap-3">
                  {rawCompareData.passages && rawCompareData.passages.length > 0 ? (
                    rawCompareData.passages.map((p: any, i: number) => (
                      <div key={i} className="text-sm text-myth-text-primary leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                        <div className="text-[10px] text-myth-accent-violet/70 mb-1 font-jetbrains">{p.source_document}</div>
                        "{p.chunk_text}"
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-myth-text-secondary italic">No overlapping text passages found.</div>
                  )}
                </div>

                <button 
                  onClick={() => onSummarizeCompare(selectedNode, compareNode)}
                  disabled={isSummarizing}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-myth-accent-violet/10 border border-myth-accent-violet/30 rounded-lg hover:bg-myth-accent-violet/20 transition-colors text-sm text-myth-accent-violet mt-4"
                >
                  {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Summarize Comparison with AI
                </button>
              </div>
            )}

            {compareResult && (
              <div className="mt-2 p-4 bg-myth-accent-violet/10 rounded-lg border border-myth-accent-violet/30">
                <h3 className="text-xs font-jetbrains text-myth-accent-violet mb-3 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} /> Comparative AI Analysis
                </h3>
                <div className="text-sm text-myth-text-primary leading-relaxed whitespace-pre-wrap">
                  {compareResult}
                </div>
              </div>
            )}
            <button 
              onClick={onClearCompare}
              className="mt-4 text-xs text-myth-text-secondary hover:text-myth-text-primary underline"
            >
              Clear Comparison
            </button>
          </div>
        )}

        {/* Relationships List */}
        {!compareNode && (
          <div>
            <h3 className="text-sm font-medium text-myth-text-secondary mb-4 tracking-wider uppercase">Known Relationships</h3>
            <div className="flex flex-col gap-3">
              {(() => {
                const relevantLinks = graphDataLinks.filter((l: any) => l.source.id === selectedNode.id || l.target.id === selectedNode.id);
                if (relevantLinks.length === 0) {
                  return <p className="text-sm text-myth-text-secondary italic">No relationships mapped yet.</p>;
                }
                
                // Deduplicate links by direction, type, and target node
                const groupedLinks = new Map<string, any>();
                relevantLinks.forEach((link: any) => {
                  const isSource = link.source.id === selectedNode.id;
                  const otherNode = isSource ? link.target.label : link.source.label;
                  const direction = isSource ? "->" : "<-";
                  const key = `${direction}|${link.type}|${otherNode}`;
                  
                  if (!groupedLinks.has(key)) {
                    groupedLinks.set(key, { direction, type: link.type, otherNode, sources: new Set([link.sourceText || "Unknown Text"]) });
                  } else {
                    groupedLinks.get(key).sources.add(link.sourceText || "Unknown Text");
                  }
                });
                
                return Array.from(groupedLinks.values()).map((group: any, idx) => (
                  <div key={idx} className="bg-myth-bg-dark/30 p-3 rounded-lg border border-myth-accent-violet/10 text-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-myth-accent-violet text-xs tracking-wide uppercase">{group.type}</span>
                      <span className="text-myth-text-secondary">{group.direction} {group.otherNode}</span>
                    </div>
                    <div className="text-[11px] text-myth-text-secondary/50 flex flex-wrap items-center gap-2 mt-1 font-jetbrains">
                      {Array.from(group.sources).map((src: any, sIdx) => (
                        <span key={sIdx} className="flex items-center gap-1">
                          <ExternalLink size={10} /> {src}
                        </span>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
