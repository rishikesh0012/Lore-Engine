"use client";

import { useEffect, useState } from "react";

interface Star {
  id: number;
  left: string;
  top: string;
  delay: string;
  size: number;
}

interface Connection {
  id: number;
  left: string;
  top: string;
  width: string;
  angle: number;
}

export default function Starfield() {
  const [starData, setStarData] = useState<{ stars: Star[]; connections: Connection[] } | null>(null);

  useEffect(() => {
    const generatedStars: Star[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      delay: `${(i * 1.3) % 5}s`,
      size: (i % 3) + 1,
    }));

    const generatedConnections: Connection[] = Array.from({ length: 15 }).map((_, i) => {
      const from = generatedStars[i % generatedStars.length];
      const to = generatedStars[(i + 7) % generatedStars.length];
      const dx = parseFloat(to.left) - parseFloat(from.left);
      const dy = parseFloat(to.top) - parseFloat(from.top);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return {
        id: i,
        left: from.left,
        top: from.top,
        width: `${distance}%`,
        angle: angle,
      };
    });

    setStarData({ stars: generatedStars, connections: generatedConnections });
  }, []);

  if (!starData) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {starData.stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-amber-200/40 animate-pulse"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
          }}
        />
      ))}

      <svg className="absolute inset-0 w-full h-full opacity-10">
        {starData.connections.map((c) => (
          <line
            key={c.id}
            x1={c.left}
            y1={c.top}
            x2={`calc(${c.left} + ${c.width})`}
            y2={c.top}
            stroke="#D4A344"
            strokeWidth="0.5"
            strokeDasharray="2,4"
          />
        ))}
      </svg>
    </div>
  );
}
