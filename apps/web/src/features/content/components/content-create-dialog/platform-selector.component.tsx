/**
 * Platform Selector Component
 *
 * Toggle buttons for selecting Facebook and Instagram platforms.
 */

import React from "react";
import { Label, cn } from "@repo/ui";
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
    <div className="space-y-2">
      <Label>Platforms</Label>
      <div className="flex gap-4">
        {(Object.keys(platformConfig) as Platform[]).map((platform) => {
          const config = platformConfig[platform];
          const Icon = config.icon;
          return (
            <button
              key={platform}
              type="button"
              onClick={() => onToggle(platform)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                platforms.includes(platform)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
      </div>
      {platforms.length === 0 && (
        <p className="text-sm text-destructive">Select at least one platform</p>
      )}
    </div>
  );
};
