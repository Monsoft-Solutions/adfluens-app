import React from "react";
import { Youtube } from "lucide-react";
import { cn } from "@repo/ui";

/**
 * Header component with YouTube branding
 * Sticky positioned with glass morphism effect
 */
export const Header: React.FC = () => {
  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-b border-border"
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg shadow-sm">
            <Youtube className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            YouTube Channel{" "}
            <span className="text-primary">Analyzer</span>
          </h1>
        </div>
      </div>
    </header>
  );
};
