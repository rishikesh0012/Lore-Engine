"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphViewProps {
  graphData: { nodes: any[], links: any[] };
  selectedNode: any | null;
  compareNode: any | null;
  onNodeClick: (node: any) => void;
  pathMode: boolean;
}

export default function GraphView({
  graphData,
  selectedNode,
  compareNode,
  onNodeClick,
  pathMode
}: GraphViewProps) {
  const fgRef = useRef<any>(null);
  
  // For path highlighting
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any | null>(null);

  const filteredData = useMemo(() => {
    return {
      nodes: graphData.nodes,
      links: graphData.links.filter(l => l.type !== "MENTIONED_IN")
    };
  }, [graphData]);

  const visibleLabels = useMemo(() => {
    const set = new Set();
    if (selectedNode) set.add(selectedNode.id);
    if (compareNode) set.add(compareNode.id);
    if (hoverNode) set.add(hoverNode.id);

    filteredData.links.forEach((l: any) => {
      const s = typeof l.source === 'object' ? l.source.id : l.source;
      const t = typeof l.target === 'object' ? l.target.id : l.target;
      if (hoverNode && (s === hoverNode.id || t === hoverNode.id)) {
        set.add(s);
        set.add(t);
      }
      if (selectedNode && (s === selectedNode.id || t === selectedNode.id)) {
        set.add(s);
        set.add(t);
      }
    });
    return set;
  }, [hoverNode, selectedNode, compareNode, filteredData.links]);

  useEffect(() => {
    // Basic BFS for shortest path if in pathMode and both nodes selected
    if (pathMode && selectedNode && compareNode) {
      const bfs = () => {
        const queue: {node: string, path: any[], linkPath: any[]}[] = [{ node: selectedNode.id, path: [selectedNode.id], linkPath: [] }];
        const visited = new Set([selectedNode.id]);
        
        // adjacency list
        const adj = new Map();
        filteredData.links.forEach(link => {
          const s = typeof link.source === 'object' ? link.source.id : link.source;
          const t = typeof link.target === 'object' ? link.target.id : link.target;
          
          if (!adj.has(s)) adj.set(s, []);
          if (!adj.has(t)) adj.set(t, []);
          
          adj.get(s).push({ target: t, link });
          adj.get(t).push({ target: s, link }); // undirected for BFS highlighting
        });
        
        while(queue.length > 0) {
          const {node, path, linkPath} = queue.shift()!;
          if (node === compareNode.id) {
            setHighlightNodes(new Set(path));
            setHighlightLinks(new Set(linkPath));
            return;
          }
          
          const neighbors = adj.get(node) || [];
          for (const n of neighbors) {
            if (!visited.has(n.target)) {
              visited.add(n.target);
              queue.push({
                node: n.target,
                path: [...path, n.target],
                linkPath: [...linkPath, n.link]
              });
            }
          }
        }
        
        // no path found
        setHighlightNodes(new Set([selectedNode.id, compareNode.id]));
        setHighlightLinks(new Set());
      };
      bfs();
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [pathMode, selectedNode, compareNode, filteredData]);

  useEffect(() => {
    if (fgRef.current) {
      // Fix layout overlaps and pull graph tighter
      fgRef.current.d3Force('charge').strength(-250).distanceMax(600);
      fgRef.current.d3Force('link').distance(80);
      // Optional: collision force to prevent nodes from stacking
      // fgRef.current.d3Force('collide', d3.forceCollide(20));
    }
  }, [filteredData]);

  const getNodeColor = (node: any) => {
    if (pathMode && selectedNode && compareNode) {
      if (highlightNodes.has(node.id)) return "#E3C37A"; // path nodes
      return "rgba(156, 147, 168, 0.2)"; // dim others
    }
    
    if (selectedNode && node.id === selectedNode.id) return "#E3C37A"; 
    if (compareNode && node.id === compareNode.id) return "#E3C37A"; 

    switch (node.type) {
      case "Character": return "#D4A344"; // Aged Gold
      case "Event": return "#7A5FB0";     // Muted Violet
      case "Location": return "#2A9D8F";  // Muted Teal
      default: return "#9C93A8";
    }
  };
  
  const getLinkColor = (link: any) => {
    if (pathMode && selectedNode && compareNode) {
      if (highlightLinks.has(link)) return "#E3C37A";
      return "rgba(122, 95, 176, 0.1)"; // dim others
    }
    return link.isContradiction ? "#C1443C" : "rgba(122, 95, 176, 0.4)";
  };
  
  const getLinkWidth = (link: any) => {
    if (pathMode && selectedNode && compareNode && highlightLinks.has(link)) return 3;
    return link.isContradiction ? 3 : 1;
  };

  return (
    <div className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={filteredData}
        nodeColor={getNodeColor}
        nodeRelSize={6}
        onNodeHover={setHoverNode}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (!visibleLabels.has(node.id)) return;
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(label, node.x, node.y + 8 + fontSize);
        }}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCanvasObjectMode={() => 'after'}
        linkCanvasObject={(link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          if (globalScale < 2) return; // Only show text when zoomed in

          const MAX_FONT_SIZE = 3;
          const start = link.source;
          const end = link.target;

          if (typeof start !== 'object' || typeof end !== 'object') return;

          const textPos = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2
          };

          const relLink = { x: end.x - start.x, y: end.y - start.y };
          let textAngle = Math.atan2(relLink.y, relLink.x);
          // Keep text upright
          if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle);
          if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle);

          const label = link.type;

          ctx.font = `${MAX_FONT_SIZE}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth, MAX_FONT_SIZE].map(n => n + MAX_FONT_SIZE * 0.2); 

          ctx.save();
          ctx.translate(textPos.x, textPos.y);
          ctx.rotate(textAngle);

          ctx.fillStyle = 'rgba(13, 11, 20, 0.8)';
          ctx.fillRect(-bckgDimensions[0] / 2, -bckgDimensions[1] / 2, bckgDimensions[0], bckgDimensions[1]);

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(227, 195, 122, 0.8)'; // myth-accent-gold
          ctx.fillText(label, 0, 0);
          ctx.restore();
        }}
        onNodeClick={onNodeClick}
        backgroundColor="#0D0B14"
      />
    </div>
  );
}
