import React from "react";
import {
  Facebook,
  Instagram,
  MessageSquare,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge, cn, Card, CardContent, Switch } from "@repo/ui";

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
 * List of connected Facebook/Instagram pages
 */
export const MetaPagesList: React.FC<MetaPagesListProps> = ({ pages }) => {
  if (pages.length === 0) {
    return (
      <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
        <Facebook className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No pages connected yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pages.map((page) => (
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
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <span>Messenger</span>
                    </div>
                    <Switch
                      checked={page.messengerEnabled}
                      disabled
                      className="scale-75"
                    />
                  </div>

                  {page.instagramAccountId && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Instagram className="w-4 h-4 text-muted-foreground" />
                        <span>@{page.instagramUsername || "Instagram"}</span>
                      </div>
                      <Switch
                        checked={page.instagramDmEnabled}
                        disabled
                        className="scale-75"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
