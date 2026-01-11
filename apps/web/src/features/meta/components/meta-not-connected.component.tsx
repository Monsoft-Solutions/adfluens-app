import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { MetaBusinessIcon } from "@/shared/components/icons/meta-business.icon";

/**
 * Empty state shown when Meta is not connected
 * Provides button to start OAuth flow
 */
export const MetaNotConnected: React.FC = () => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data: oauthUrlData, isLoading } = useQuery({
    ...trpc.meta.getOAuthUrl.queryOptions({ redirectPath: "/meta" }),
    enabled: !!organization,
  });

  const handleConnect = () => {
    if (oauthUrlData?.url) {
      window.location.href = oauthUrlData.url;
    }
  };

  return (
    <div className="animate-reveal">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
          <MetaBusinessIcon className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Meta Business Not Connected
        </h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Connect your Meta (Facebook/Instagram) account to manage leads,
          respond to messages, and set up AI-powered auto-replies.
        </p>
        <Button
          onClick={handleConnect}
          disabled={isLoading || !oauthUrlData?.url}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MetaBusinessIcon className="w-4 h-4 mr-2" />
          )}
          Connect Meta Business
        </Button>
      </div>
    </div>
  );
};
