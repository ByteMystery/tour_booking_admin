import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  collapsed?: boolean;
  theme?: "light" | "dark";
}

export function Logo({ className, collapsed = false, theme = "dark" }: LogoProps) {
  const zioColor = "#007bff";

  if (collapsed) {
    // Monogram icon for collapsed sidebar
    return (
      <svg
        className={cn("h-8 w-8 shrink-0", className)}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="8" fill={zioColor} />
        <path
          d="M10,10 H22 L10,22 H22"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  // Full brand logo loaded from public/logo.png
  return (
    <div className={cn("flex items-center shrink-0", className)}>
      <img
        src="/logo.png"
        alt="Tripzio Logo"
        className="h-6 w-auto object-contain"
      />
    </div>
  );
}
