import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "purple" | "gradient" | "conflict";
  children: React.ReactNode;
  className?: string;
}

export const Card = React.memo(function Card({
  variant = "default",
  children,
  className = "",
  ...props
}: CardProps) {
  const baseStyle = "rounded-2xl p-5 backdrop-blur-md transition-all duration-300 shadow-xl overflow-hidden";
  
  const variantStyles = {
    default: "bg-[#1C1830]/80 border border-purple-500/15 hover:border-[#D4A344]/40",
    purple: "bg-[#17131F] border border-purple-500/20 hover:border-purple-500/40",
    gradient: "bg-gradient-to-br from-[#1C1830] via-purple-950/40 to-[#0D0B14] border border-purple-500/30 hover:border-[#D4A344]/50",
    conflict: "bg-[#1C1830]/80 border border-rose-500/30 hover:border-rose-500/50"
  };

  return (
    <div className={`${baseStyle} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
});
