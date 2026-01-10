import React, { useState } from "react";
import {
  Facebook,
  Instagram,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Users,
  Loader2,
} from "lucide-react";
import {
  Badge,
  cn,
  Card,
  CardContent,
  Switch,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useQueryClient, useMutation } from "@tanstack/react-query";

type MetaPage = {
  id: string;
  pageId: string;
  pageName: string;
  messengerEnabled: boolean;
  instagramAccountId: string | null;
  instagramUsername: string | null;
  instagramDmEnabled: boolean;
  status: string;
  pageData?: {
    category?: string;
    followersCount?: number;
    profilePicture?: string;
  } | null;
};

type MetaPagesListProps = {
  pages: MetaPage[];
};

/**
 * List of connected Facebook/Instagram pages with toggles and sync buttons
 */
export const MetaPagesList: React.FC<MetaPagesListProps> = ({ pages }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Track sync status per page
  const [syncStatus, setSyncStatus] = useState<
    Record<string, { leads?: string; conversations?: string }>
  >({});

  // Update page mutation
  const updatePageMutation = useMutation(
    trpc.meta.updatePage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["meta", "getConnection"] });
      },
    })
  );

  // Sync leads mutation
  const syncLeadsMutation = useMutation(
    trpc.meta.syncLeads.mutationOptions({
      onSuccess: (data, variables) => {
        setSyncStatus((prev) => ({
          ...prev,
          [variables.pageId]: {
            ...prev[variables.pageId],
            leads: `Synced ${data.synced} leads`,
          },
        }));
        queryClient.invalidateQueries({ queryKey: ["meta", "listLeads"] });
      },
      onError: (error, variables) => {
        setSyncStatus((prev) => ({
          ...prev,
          [variables.pageId]: {
            ...prev[variables.pageId],
            leads: `Error: ${error.message}`,
          },
        }));
      },
    })
  );

  // Sync conversations mutation
  const syncConversationsMutation = useMutation(
    trpc.meta.syncConversations.mutationOptions({
      onSuccess: (data, variables) => {
        setSyncStatus((prev) => ({
          ...prev,
          [variables.pageId]: {
            ...prev[variables.pageId],
            conversations: `Synced ${data.synced} conversations`,
          },
        }));
        queryClient.invalidateQueries({
          queryKey: ["meta", "listConversations"],
        });
      },
      onError: (error, variables) => {
        setSyncStatus((prev) => ({
          ...prev,
          [variables.pageId]: {
            ...prev[variables.pageId],
            conversations: `Error: ${error.message}`,
          },
        }));
      },
    })
  );

  const handleToggleMessenger = (page: MetaPage) => {
    updatePageMutation.mutate({
      pageId: page.id,
      messengerEnabled: !page.messengerEnabled,
    });
  };

  const handleToggleInstagram = (page: MetaPage) => {
    updatePageMutation.mutate({
      pageId: page.id,
      instagramDmEnabled: !page.instagramDmEnabled,
    });
  };

  const handleSyncLeads = (page: MetaPage) => {
    setSyncStatus((prev) => ({
      ...prev,
      [page.id]: { ...prev[page.id], leads: undefined },
    }));
    syncLeadsMutation.mutate({ pageId: page.id });
  };

  const handleSyncConversations = (page: MetaPage) => {
    setSyncStatus((prev) => ({
      ...prev,
      [page.id]: { ...prev[page.id], conversations: undefined },
    }));
    syncConversationsMutation.mutate({ pageId: page.id });
  };

  if (pages.length === 0) {
    return (
      <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
        <Facebook className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No pages connected yet.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => {
          const isUpdating =
            updatePageMutation.isPending &&
            updatePageMutation.variables?.pageId === page.id;
          const isSyncingLeads =
            syncLeadsMutation.isPending &&
            syncLeadsMutation.variables?.pageId === page.id;
          const isSyncingConversations =
            syncConversationsMutation.isPending &&
            syncConversationsMutation.variables?.pageId === page.id;
          const pageStatus = syncStatus[page.id];

          return (
            <Card key={page.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Page Icon/Avatar */}
                  <div className="bg-primary/10 p-3 rounded-lg shrink-0">
                    <Facebook className="w-6 h-6 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Page Name & Status */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground truncate">
                          {page.pageName}
                        </h3>
                        <Badge
                          variant={
                            page.status === "active" ? "default" : "secondary"
                          }
                          className={cn(
                            "shrink-0",
                            page.status === "active" &&
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}
                        >
                          {page.status === "active" ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {page.status}
                            </>
                          )}
                        </Badge>
                      </div>
                      {page.pageData?.category && (
                        <p className="text-xs text-muted-foreground">
                          {page.pageData.category}
                        </p>
                      )}
                    </div>

                    {/* Messaging Toggles */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm cursor-help">
                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                              <span>Messenger</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enable AI auto-replies for Facebook Messenger</p>
                          </TooltipContent>
                        </Tooltip>
                        <Switch
                          checked={page.messengerEnabled}
                          onCheckedChange={() => handleToggleMessenger(page)}
                          disabled={isUpdating}
                          className="scale-75"
                        />
                      </div>

                      {page.instagramAccountId && (
                        <div className="flex items-center justify-between">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 text-sm cursor-help">
                                <Instagram className="w-4 h-4 text-muted-foreground" />
                                <span>
                                  @{page.instagramUsername || "Instagram"}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Enable AI auto-replies for Instagram DMs</p>
                            </TooltipContent>
                          </Tooltip>
                          <Switch
                            checked={page.instagramDmEnabled}
                            onCheckedChange={() => handleToggleInstagram(page)}
                            disabled={isUpdating}
                            className="scale-75"
                          />
                        </div>
                      )}
                    </div>

                    {/* Sync Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncLeads(page)}
                        disabled={isSyncingLeads}
                        className="flex-1"
                      >
                        {isSyncingLeads ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Users className="w-3 h-3 mr-1" />
                        )}
                        Sync Leads
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncConversations(page)}
                        disabled={isSyncingConversations}
                        className="flex-1"
                      >
                        {isSyncingConversations ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Sync Messages
                      </Button>
                    </div>

                    {/* Sync Status Messages */}
                    {(pageStatus?.leads || pageStatus?.conversations) && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        {pageStatus.leads && (
                          <p
                            className={cn(
                              pageStatus.leads.startsWith("Error")
                                ? "text-destructive"
                                : "text-emerald-600"
                            )}
                          >
                            {pageStatus.leads}
                          </p>
                        )}
                        {pageStatus.conversations && (
                          <p
                            className={cn(
                              pageStatus.conversations.startsWith("Error")
                                ? "text-destructive"
                                : "text-emerald-600"
                            )}
                          >
                            {pageStatus.conversations}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
