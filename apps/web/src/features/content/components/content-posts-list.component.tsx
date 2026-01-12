/**
 * Content Posts List
 *
 * Displays a list of content posts with filtering and creation options.
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Image } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { ContentCreateDialog } from "./content-create-dialog";
import { ContentPostCard } from "./content-post-card.component";

type ContentPostsListProps = {
  pageId?: string | null;
};

const statusOptions = [
  { value: "all", label: "All Posts" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
] as const;

export const ContentPostsList: React.FC<ContentPostsListProps> = ({
  pageId,
}) => {
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    ...trpc.content.list.queryOptions({
      pageId: pageId ?? undefined,
      status:
        statusFilter !== "all"
          ? (statusFilter as "draft" | "pending" | "published" | "failed")
          : undefined,
      limit: 20,
    }),
    enabled: !!pageId,
  });

  const posts = data?.posts || [];

  if (!pageId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="text-center">
            <Image className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Page</h3>
            <p className="text-muted-foreground text-sm">
              Choose a Facebook or Instagram page to manage content.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Posts list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12">
            <div className="text-center">
              <Image className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first content post to publish on Facebook and
                Instagram.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <ContentPostCard key={post.id} post={post} onUpdate={refetch} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <ContentCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        pageId={pageId}
        onSuccess={() => {
          setIsCreateDialogOpen(false);
          refetch();
        }}
      />
    </div>
  );
};
