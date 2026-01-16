import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Users, Heart, Share2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";

type MetaDashboardSectionProps = {
  days: number;
};

/**
 * Meta (Facebook/Instagram) section of the dashboard
 *
 * Note: Full Meta insights require additional API endpoints.
 * This is a placeholder that links to the main Meta view.
 */
export const MetaDashboardSection: React.FC<MetaDashboardSectionProps> = () => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    ...trpc.meta.getConnection.queryOptions(),
    enabled: !!organization,
  });

  if (isLoadingConnection) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const connection = connectionData?.connection;
  const pages = connectionData?.pages || [];

  // Not connected
  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.77-3.92 1.09 0 2.24.2 2.24.2v2.47H15.2c-1.25 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7A10.03 10.03 0 0 0 22 12.06c0-5.53-4.5-10.02-10-10.02z" />
            </svg>
            Connect Meta
          </CardTitle>
          <CardDescription>
            Connect your Facebook and Instagram pages to see engagement metrics,
            follower growth, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/meta">
            <Button>
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Meta
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.92 3.77-3.92 1.09 0 2.24.2 2.24.2v2.47H15.2c-1.25 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7A10.03 10.03 0 0 0 22 12.06c0-5.53-4.5-10.02-10-10.02z" />
            </svg>
            Meta
          </h2>
          <p className="text-sm text-muted-foreground">
            {connection.metaUserName || "Connected"} &bull; {pages.length}{" "}
            page(s)
          </p>
        </div>
        <Link to="/meta">
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            Full Dashboard
          </Button>
        </Link>
      </div>

      {/* Connected Pages */}
      {pages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{page.pageName}</CardTitle>
                <CardDescription className="text-xs">
                  {page.instagramAccountId ? "Instagram" : "Facebook"}
                  {page.instagramUsername && ` @${page.instagramUsername}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Users className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">-</p>
                    <p className="text-xs text-muted-foreground">Followers</p>
                  </div>
                  <div>
                    <Heart className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">-</p>
                    <p className="text-xs text-muted-foreground">Engagement</p>
                  </div>
                  <div>
                    <Share2 className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">-</p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No pages connected. Visit the Meta dashboard to connect pages.
            </p>
            <Link to="/meta" className="mt-4 inline-block">
              <Button variant="outline">Connect Pages</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Info about insights */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            Detailed engagement metrics and insights are available in the{" "}
            <Link to="/meta" className="text-primary hover:underline">
              full Meta dashboard
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
