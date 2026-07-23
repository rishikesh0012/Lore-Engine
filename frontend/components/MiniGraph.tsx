import { useRef, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { getApiBaseUrl } from "@/lib/api";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface MiniGraphProps {
  entityLabel: string;
  isConflictMode: boolean;
}

export default function MiniGraph({ entityLabel, isConflictMode }: MiniGraphProps) {
  const fgRef = useRef<any>(null);

  const [localGraph, setLocalGraph] = useState({ nodes: [], links: [] });

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/graph?entity=${encodeURIComponent(entityLabel)}`)
      .then(res => res.json())
      .then(data => {
        const filteredLinks = data.links.filter((l: any) => l.type !== "MENTIONED_IN");
        setLocalGraph({ nodes: data.nodes, links: filteredLinks });
      })
      .catch(console.error);
  }, [entityLabel]);

  useEffect(() => {
    // Auto-center on load
    if (fgRef.current && localGraph.nodes.length > 0) {
      setTimeout(() => {
        fgRef.current?.zoomToFit(400, 50);
      }, 500);
    }
  }, [localGraph]);

  const getNodeColor = (node: any) => {
    if (node.label === entityLabel) return "#E3C37A"; // Center node gold
    switch (node.type) {
      case "Character": return "#D4A344";
      case "Event": return "#7A5FB0";
      case "Location": return "#2A9D8F";
      default: return "#9C93A8";
    }
  };

  const getLinkColor = (link: any) => {
    if (isConflictMode && link.isContradiction) return "#C1443C"; // Red for conflicts
    return "rgba(122, 95, 176, 0.4)";
  };

  return (
    <div className="w-full h-64 bg-myth-bg-dark border border-myth-accent-gold/20 rounded-xl overflow-hidden mt-4 relative">
      <div className="absolute top-2 left-2 z-10 text-[10px] font-jetbrains text-myth-text-secondary uppercase tracking-widest bg-myth-bg-dark/80 px-2 py-1 rounded">
        Local Neighborhood: {entityLabel}
      </div>
      <ForceGraph2D
        ref={fgRef}
        graphData={localGraph}
        nodeColor={getNodeColor}
        nodeLabel="label"
        nodeRelSize={4}
        linkColor={getLinkColor}
        linkWidth={(link: any) => (isConflictMode && link.isContradiction ? 3 : 1)}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        backgroundColor="#0A0810"
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (globalScale < 1.5) return;
          const start = link.source;
          const end = link.target;
          if (typeof start !== 'object' || typeof end !== 'object') return;

          const textPos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2
          };

          const relLink = { x: end.x - start.x, y: end.y - start.y };
          let textAngle = Math.atan2(relLink.y, relLink.x);
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

          // For conflicts, highlight the source texts that conflict
          const label = isConflictMode && link.isContradiction 
            ? `${link.type} (${link.sourceText})` 
            : link.type;

          ctx.font = `3px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, 3].map(n => n + 3 * 0.2); 

          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);
          ctx.fillStyle = 'rgba(10, 8, 16, 0.9)';
          ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isConflictMode && link.isContradiction ? '#C1443C' : 'rgba(227, 195, 122, 0.8)';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }}
      />
    </div>
  );
}
