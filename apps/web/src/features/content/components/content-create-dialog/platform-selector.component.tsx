/**
 * Platform Selector Component
 *
 * Toggle buttons for selecting Facebook and Instagram platforms.
 */

import React from "react";
import {
  Label,
  cn,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import type { Platform } from "./content-create-dialog.types";
import { platformConfig } from "./content-create-dialog.types";

type PlatformSelectorProps = {
  platforms: Platform[];
  onToggle: (platform: Platform) => void;
};

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  platforms,
  onToggle,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">Where to post</Label>
        <span className="text-xs text-muted-foreground">
          (select one or more)
        </span>
      </div>
      <TooltipProvider>
        <div className="flex gap-3">
          {(Object.keys(platformConfig) as Platform[]).map((platform) => {
            const config = platformConfig[platform];
            const Icon = config.icon;
            const isSelected = platforms.includes(platform);
            return (
              <Tooltip key={platform}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onToggle(platform)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 transition-all font-medium",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {config.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isSelected ? "Click to remove" : "Click to add"}{" "}
                    {config.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max {config.maxCaption.toLocaleString()} characters
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      {platforms.length === 0 && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
          Select at least one platform
        </p>
      )}
    </div>
  );
};
