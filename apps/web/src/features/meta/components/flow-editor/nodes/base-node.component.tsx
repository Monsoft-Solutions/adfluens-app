/**
 * Base Node Component
 *
 * Shared wrapper for all flow editor nodes with consistent styling
 */

import type { ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { Card, cn } from "@repo/ui";
import { Trash2, GripVertical } from "lucide-react";

type BaseNodeProps = {
  children: ReactNode;
  selected?: boolean;
  icon: ReactNode;
  iconColor: string;
  bgColor: string;
  borderColor?: string;
  title: string;
  subtitle?: string;
  hasTargetHandle?: boolean;
  hasSourceHandle?: boolean;
  hasMultipleSources?: boolean;
  onDelete?: () => void;
};

export function BaseNode({
  children,
  selected,
  icon,
  iconColor,
  bgColor,
  borderColor,
  title,
  subtitle,
  hasTargetHandle = true,
  hasSourceHandle = true,
  hasMultipleSources = false,
  onDelete,
}: BaseNodeProps) {
  return (
    <Card
      className={cn(
        "w-64 shadow-md transition-all",
        bgColor,
        selected && "ring-2",
        selected && (borderColor || "ring-primary")
      )}
    >
      {/* Target handle (input) */}
      {hasTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50">
        <div className="cursor-move">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className={cn("p-1.5 rounded-md", iconColor)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground truncate">
              {subtitle}
            </div>
          )}
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">{children}</div>

      {/* Source handle (output) */}
      {hasSourceHandle && !hasMultipleSources && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}

      {/* Multiple source handles for condition nodes */}
      {hasMultipleSources && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-background"
            style={{ left: "30%" }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-background"
            style={{ left: "70%" }}
          />
        </>
      )}
    </Card>
  );
}
