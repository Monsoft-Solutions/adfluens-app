import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, cn } from "@repo/ui";
import { GoogleBusinessIcon } from "@/shared/components/icons/google-business.icon";

type PlatformConnectionStatus = {
  ga: {
    connected: boolean;
    propertyName?: string;
    googleEmail?: string;
  } | null;
  meta: {
    connected: boolean;
    pageCount: number;
    userName?: string;
  } | null;
  gmb: {
    connected: boolean;
    locationName?: string;
  } | null;
};

type ConnectionStatusCardsProps = {
  connectionStatus?: PlatformConnectionStatus;
};

/**
 * Display connection status for all platforms
 */
export const ConnectionStatusCards: React.FC<ConnectionStatusCardsProps> = ({
  connectionStatus,
}) => {
  const platforms = [
    {
      key: "ga" as const,
      name: "Google Analytics",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.84 2.998a2.151 2.151 0 0 0-2.16 2.16v13.68a2.16 2.16 0 1 0 4.32 0V5.158a2.152 2.152 0 0 0-2.16-2.16zm-11.04 9.6a2.16 2.16 0 0 0-2.16 2.16v4.08a2.16 2.16 0 1 0 4.32 0v-4.08a2.16 2.16 0 0 0-2.16-2.16zm-10.8 4.8a2.16 2.16 0 1 0 0 4.32 2.16 2.16 0 0 0 0-4.32z" />
        </svg>
      ),
      connected: connectionStatus?.ga?.connected || false,
      details: connectionStatus?.ga?.propertyName || "Not connected",
      email: connectionStatus?.ga?.googleEmail,
      link: null, // Will handle GA connection via modal
      color: "text-orange-500",
    },
    {
      key: "meta" as const,
      name: "Meta",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.77-3.92 1.09 0 2.24.2 2.24.2v2.47H15.2c-1.25 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7A10.03 10.03 0 0 0 22 12.06c0-5.53-4.5-10.02-10-10.02z" />
        </svg>
      ),
      connected: connectionStatus?.meta?.connected || false,
      details: connectionStatus?.meta?.connected
        ? `${connectionStatus.meta.pageCount} page${connectionStatus.meta.pageCount !== 1 ? "s" : ""} connected`
        : "Not connected",
      email: connectionStatus?.meta?.userName,
      link: "/meta",
      color: "text-blue-600",
    },
    {
      key: "gmb" as const,
      name: "Google Business",
      icon: <GoogleBusinessIcon className="w-6 h-6" />,
      connected: connectionStatus?.gmb?.connected || false,
      details: connectionStatus?.gmb?.locationName || "Not connected",
      link: "/gmb",
      color: "text-green-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {platforms.map((platform) => {
        const content = (
          <Card
            className={cn(
              "transition-colors",
              !platform.connected && "opacity-75 hover:opacity-100",
              platform.link && "cursor-pointer hover:border-primary/50"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {platform.name}
              </CardTitle>
              <div className={platform.color}>{platform.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                {platform.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-sm font-medium",
                    platform.connected
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                  )}
                >
                  {platform.connected ? "Connected" : "Not Connected"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {platform.details}
              </p>
              {platform.email && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {platform.email}
                </p>
              )}
              {platform.link && (
                <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                  <span>{platform.connected ? "Manage" : "Connect"}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              )}
            </CardContent>
          </Card>
        );

        if (platform.link) {
          return (
            <Link key={platform.key} to={platform.link}>
              {content}
            </Link>
          );
        }

        return <div key={platform.key}>{content}</div>;
      })}
    </div>
  );
};
