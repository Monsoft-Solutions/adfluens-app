import React from "react";
import { Link } from "react-router-dom";
import { Settings, ExternalLink } from "lucide-react";
import { Button } from "@repo/ui";
import { GoogleBusinessIcon } from "@/shared/components/icons/google-business.icon";

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
