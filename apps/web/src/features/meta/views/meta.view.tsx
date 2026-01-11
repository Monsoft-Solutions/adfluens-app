import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { FileText, MessageSquare, Users, Inbox, Bot, Zap } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import { MetaBusinessIcon } from "@/shared/components/icons/meta-business.icon";
import { MetaNotConnected } from "../components/meta-not-connected.component";
import { MetaPageSelector } from "../components/meta-page-selector.component";
import { MetaPagesList } from "../components/meta-pages-list.component";
import { MetaLeadsList } from "../components/meta-leads-list.component";
import { MetaConversationsList } from "../components/meta-conversations-list.component";
import { MetaBotSettings } from "../components/meta-bot-settings.component";
import { MetaInbox } from "../components/meta-inbox.component";
import { MetaFlows } from "../components/meta-flows.component";

/**
 * Meta Business (Facebook/Instagram) Management View
 *
 * Main view for managing Meta integration: pages, leads, and conversations.
 */
export const MetaView: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
  const [setupCode, setSetupCode] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  // Check for OAuth callback parameters
  useEffect(() => {
    const metaSetupCode = searchParams.get("meta_setup_code");
    const metaError = searchParams.get("meta_error");

    if (metaError) {
      setError(decodeURIComponent(metaError));
      searchParams.delete("meta_error");
      setSearchParams(searchParams, { replace: true });
    } else if (metaSetupCode) {
      setSetupCode(metaSetupCode);
      setIsPageSelectorOpen(true);
      searchParams.delete("meta_setup_code");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    ...trpc.meta.getConnection.queryOptions(),
    enabled: !!organization,
  });

  const handlePageSelectorSuccess = () => {
    setIsPageSelectorOpen(false);
    setSetupCode(null);
    queryClient.invalidateQueries({
      queryKey: trpc.meta.getConnection.queryKey(),
    });
  };

  // No organization
  if (!organization) {
    return (
      <div className="animate-reveal">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
            <MetaBusinessIcon className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Please select or create an organization to manage Meta Business.
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
  if (!connectionData?.isConnected) {
    return (
      <>
        <MetaNotConnected />
        {setupCode && (
          <MetaPageSelector
            open={isPageSelectorOpen}
            onOpenChange={setIsPageSelectorOpen}
            setupCode={setupCode}
            onSuccess={handlePageSelectorSuccess}
            onError={(err) => {
              setError(err);
              setIsPageSelectorOpen(false);
              setSetupCode(null);
            }}
          />
        )}
      </>
    );
  }

  const connection = connectionData.connection;
  const pages = connectionData.pages || [];

  return (
    <div className="animate-reveal">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <MetaBusinessIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
              Meta Business
            </h1>
            <p className="text-muted-foreground">
              {connection?.metaUserName || "Connected Account"} · {pages.length}{" "}
              {pages.length === 1 ? "page" : "pages"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-6">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Leads</span>
          </TabsTrigger>
          <TabsTrigger
            value="conversations"
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Inbox</span>
          </TabsTrigger>
          <TabsTrigger value="flows" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Flows</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Bot</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          <MetaPagesList pages={pages} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <MetaLeadsList />
        </TabsContent>

        <TabsContent value="conversations" className="space-y-6">
          <MetaConversationsList />
        </TabsContent>

        <TabsContent value="inbox" className="space-y-6">
          <MetaInbox />
        </TabsContent>

        <TabsContent value="flows" className="space-y-6">
          {pages.length === 0 ? (
            <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
              <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Connect a page first to create conversation flows.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Selector */}
              <div className="flex items-center gap-4">
                <Label>Select Page:</Label>
                <Select
                  value={selectedPageId || pages[0]?.id || ""}
                  onValueChange={setSelectedPageId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.pageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flows Component */}
              <MetaFlows pageId={selectedPageId || pages[0]?.id || ""} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {pages.length === 0 ? (
            <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
              <Bot className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Connect a page first to configure bot settings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Page Selector */}
              <div className="flex items-center gap-4">
                <Label>Select Page:</Label>
                <Select
                  value={selectedPageId || pages[0]?.id || ""}
                  onValueChange={setSelectedPageId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a page" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.pageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bot Settings */}
              <MetaBotSettings pageId={selectedPageId || pages[0]?.id || ""} />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Page Selector Modal (for OAuth callback) */}
      {setupCode && (
        <MetaPageSelector
          open={isPageSelectorOpen}
          onOpenChange={setIsPageSelectorOpen}
          setupCode={setupCode}
          onSuccess={handlePageSelectorSuccess}
          onError={(err) => {
            setError(err);
            setIsPageSelectorOpen(false);
            setSetupCode(null);
          }}
        />
      )}
    </div>
  );
};
