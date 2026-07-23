import React from "react";

export const Skeleton = React.memo(function Skeleton({
  className = ""
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-[#1C1830]/60 border border-purple-500/10 rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
});
