import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";

interface KeyFiguresProps {
  source: string;
  onFigureClick: (nodeLabel: string) => void;
}

export default function KeyFigures({ source, onFigureClick }: KeyFiguresProps) {
  const [figures, setFigures] = useState<{character: string, degree: number}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Overlap view logic could use a different query without source, but here we just pass the source ID
    const sourceParam = source === "Overlap" ? "" : `?source=${source}`;
    
    fetch(`http://localhost:8002/api/key-figures${sourceParam}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFigures(data);
        } else {
          setFigures([]);
        }
      })
      .catch(err => console.error("Failed to fetch key figures", err))
      .finally(() => setIsLoading(false));
  }, [source]);

  return (
    <div className="absolute top-24 left-6 w-64 bg-myth-card/90 backdrop-blur-md border border-myth-accent-gold/20 rounded-xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[calc(100vh-120px)]">
      <div className="p-4 border-b border-myth-accent-gold/10 flex items-center gap-2 bg-myth-bg-dark/50">
        <Users size={16} className="text-myth-accent-gold" />
        <h3 className="font-cormorant font-medium text-lg">Key Figures</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex justify-center p-4 text-myth-accent-gold">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : figures.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {figures.map((fig, idx) => (
              <li key={idx}>
                <button
                  onClick={() => onFigureClick(fig.character)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-myth-accent-violet/10 text-sm flex justify-between items-center transition-colors group"
                >
                  <span className="font-sans text-myth-text-primary group-hover:text-myth-accent-gold transition-colors">
                    {idx + 1}. {fig.character}
                  </span>
                  <span className="text-xs text-myth-text-secondary font-jetbrains bg-myth-bg-dark/50 px-2 py-0.5 rounded-full">
                    {fig.degree}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-sm text-myth-text-secondary text-center italic border border-dashed border-myth-text-secondary/20 rounded-lg m-2">
            <p>No key figures found.</p>
            <p className="text-[11px] mt-2 opacity-70">
              (This source text may not have been extracted into the graph yet)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
