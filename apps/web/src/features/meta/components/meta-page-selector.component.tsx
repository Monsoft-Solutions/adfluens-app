import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, Check, Instagram, Facebook } from "lucide-react";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Checkbox,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";

type MetaPageSelectorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setupCode: string;
  onSuccess: () => void;
  onError: (error: string) => void;
};

type AvailablePage = {
  id: string;
  name: string;
  category?: string;
  accessToken: string;
  instagramBusinessAccount?: {
    id: string;
    username?: string;
  };
};

/**
 * Page Selector Modal
 *
 * After OAuth, allows user to select which Facebook Pages to connect.
 * Uses setupCode to securely retrieve available pages from the server.
 */
export const MetaPageSelector: React.FC<MetaPageSelectorProps> = ({
  open,
  onOpenChange,
  setupCode,
  onSuccess,
  onError,
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  // Fetch available pages
  const {
    data: pagesData,
    isLoading: isLoadingPages,
    error: pagesError,
  } = useQuery({
    ...trpc.meta.listAvailablePages.queryOptions({ setupCode }),
    enabled: open,
  });

  // Save selection mutation
  const selectPagesMutation = useMutation({
    ...trpc.meta.selectPages.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.meta.getConnection.queryKey(),
      });
      onSuccess();
    },
    onError: (err) => {
      onError(err.message || "Failed to save connection");
    },
  });

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedPages(new Set());
    }
  }, [open]);

  const togglePage = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleConfirm = () => {
    if (selectedPages.size === 0 || !pagesData?.pages) return;

    const pagesToConnect = pagesData.pages
      .filter((page: AvailablePage) => selectedPages.has(page.id))
      .map((page: AvailablePage) => ({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.accessToken,
        instagramAccountId: page.instagramBusinessAccount?.id,
        instagramUsername: page.instagramBusinessAccount?.username,
      }));

    selectPagesMutation.mutate({
      setupCode,
      pages: pagesToConnect,
    });
  };

  const pages = pagesData?.pages as AvailablePage[] | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Facebook Pages</DialogTitle>
          <DialogDescription>
            Choose which Facebook Pages you want to connect. Pages with linked
            Instagram accounts will also have Instagram messaging enabled.
          </DialogDescription>
        </DialogHeader>

        {pagesError && (
          <div
            className={cn(
              "bg-destructive/10 border border-destructive/20 text-destructive",
              "px-4 py-3 rounded-lg flex items-center gap-3"
            )}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{pagesError.message}</p>
          </div>
        )}

        <div className="space-y-4">
          {isLoadingPages ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !pages || pages.length === 0 ? (
            <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
              <Facebook className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No Facebook Pages found. Make sure you have admin access to at
                least one Facebook Page.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {pages.map((page: AvailablePage) => (
                <button
                  key={page.id}
                  onClick={() => togglePage(page.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border",
                    "bg-background hover:bg-muted/50 transition-colors",
                    "text-left",
                    selectedPages.has(page.id) && "border-primary bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={selectedPages.has(page.id)}
                    onCheckedChange={() => togglePage(page.id)}
                    className="pointer-events-none"
                  />
                  <div className="bg-primary/10 p-2 rounded">
                    <Facebook className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {page.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {page.category && <span>{page.category}</span>}
                      {page.instagramBusinessAccount && (
                        <span className="flex items-center gap-1">
                          <Instagram className="w-3 h-3" />@
                          {page.instagramBusinessAccount.username}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedPages.has(page.id) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="flex justify-between items-center gap-2 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {selectedPages.size} page{selectedPages.size !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                selectedPages.size === 0 || selectPagesMutation.isPending
              }
            >
              {selectPagesMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Pages"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
