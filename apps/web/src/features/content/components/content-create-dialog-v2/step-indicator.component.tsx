/**
 * Step Indicator Component
 *
 * Visual step indicator for multi-step workflows.
 */

import { CheckCircle2 } from "lucide-react";
import { cn } from "@repo/ui";

type StepIndicatorProps = {
  step: number;
  title: string;
  icon: React.ReactNode;
  isComplete?: boolean;
  isActive?: boolean;
};

export function StepIndicator({
  step,
  title,
  icon,
  isComplete,
  isActive,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
          isComplete
            ? "bg-success text-success-foreground"
            : isActive
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
        )}
      >
        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span
        className={cn(
          "text-sm font-medium flex items-center gap-1.5",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {icon}
        {title}
      </span>
    </div>
  );
}
