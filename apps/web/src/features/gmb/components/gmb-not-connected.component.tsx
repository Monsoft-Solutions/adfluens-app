import React from "react";
import { Link } from "react-router-dom";
import { Settings, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui";

/** Google Business Icon */
const GoogleBusinessIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

/**
 * Empty state shown when GMB is not connected
 */
export const GMBNotConnected: React.FC = () => {
  return (
    <div className="animate-reveal">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
          <GoogleBusinessIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Google Business Not Connected
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Connect your Google Business Profile to manage posts, view reviews,
          and respond to customer feedback directly from this app.
        </p>
        <Button asChild>
          <Link to="/settings">
            <Settings className="w-4 h-4 mr-2" />
            Go to Settings
            <ExternalLink className="w-3 h-3 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
};
