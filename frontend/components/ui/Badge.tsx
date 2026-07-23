import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "violet" | "emerald" | "rose" | "neutral";
  className?: string;
}

export const Badge = React.memo(function Badge({
  children,
  variant = "gold",
  className = ""
}: BadgeProps) {
  const variantStyles = {
    gold: "bg-purple-950/80 text-[#D4A344] border-purple-500/30",
    violet: "bg-[#7A5FB0]/15 text-[#7A5FB0] border-[#7A5FB0]/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    neutral: "bg-slate-950/60 text-[#9C93A8] border-slate-800"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
});
