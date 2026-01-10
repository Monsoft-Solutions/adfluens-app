import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, MessageSquare, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { GMBNotConnected } from "../components/gmb-not-connected.component";
import { GMBOverview } from "../components/gmb-overview.component";
import { GMBReviewsList } from "../components/gmb-reviews-list.component";
import { GMBPostsList } from "../components/gmb-posts-list.component";

/** Google Business Icon */
const GoogleBusinessIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

/**
 * Google Business Profile Management View
 *
 * Main view for managing GMB: overview, reviews, and posts.
 */
export const GMBView: React.FC = () => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    ...trpc.gmb.getConnection.queryOptions(),
    enabled: !!organization,
  });

  // No organization
  if (!organization) {
    return (
      <div className="animate-reveal">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
            <GoogleBusinessIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Please select or create an organization to manage Google Business.
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoadingConnection) {
    return (
      <div className="animate-reveal space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Not connected
  if (!connectionData?.connection) {
    return <GMBNotConnected />;
  }

  const connection = connectionData.connection;

  return (
    <div className="animate-reveal">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <GoogleBusinessIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
              Google Business
            </h1>
            <p className="text-muted-foreground">
              {connection.gmbLocationName || "Business Location"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Posts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <GMBOverview />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <GMBReviewsList />
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <GMBPostsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
