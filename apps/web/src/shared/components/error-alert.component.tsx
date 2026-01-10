/**
 * Error Alert Component
 *
 * A reusable error display component with optional retry functionality.
 */

import type React from "react";
import { AlertCircle } from "lucide-react";
import { Button, cn } from "@repo/ui";

type ErrorAlertProps = {
  /** Error message to display */
  message: string;

  /** Optional callback for retry action */
  onRetry?: () => void;

  /** Optional custom class name */
  className?: string;
};

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onRetry,
  className,
}) => (
  <div
    className={cn(
      "p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive",
      className
    )}
  >
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  </div>
);
