"use client";

import { useEffect, useState } from "react";

export default function Starfield() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const stars = Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    size: Math.random() * 2 + 1,
  }));

  const connections = Array.from({ length: 15 }).map((_, i) => {
    const from = stars[Math.floor(Math.random() * stars.length)];
    const to = stars[Math.floor(Math.random() * stars.length)];
    // Just drawing some random abstract lines to simulate constellations
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

  return (
    <div className="night-sky">
      {stars.map((star) => (
        <div
          key={`star-${star.id}`}
          className="star"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.delay,
          }}
        />
      ))}
      {connections.map((conn) => (
        <div
          key={`conn-${conn.id}`}
          className="star-connection"
          style={{
            left: conn.left,
            top: conn.top,
            width: conn.width,
            transform: `rotate(${conn.angle}deg)`,
          }}
        />
      ))}
    </div>
  );
}
