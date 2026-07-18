import React from "react";
import { cn } from "../../lib/utils";

export function NeonGradientCard({
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cn(
        "relative z-10 group overflow-hidden rounded-[20px] bg-neutral-900 p-[1px] transition-all duration-300",
        className
      )}
      {...props}
    >
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-teal-500/50 via-blue-500/50 to-purple-500/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      
      <div className="absolute -inset-[200%] z-0 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#00c9a7_0%,#3b82f6_50%,#00c9a7_100%)] opacity-0 transition-opacity duration-500 group-hover:opacity-20" />

      <div className="relative z-10 h-full w-full rounded-[19px] bg-slate-900/90 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
