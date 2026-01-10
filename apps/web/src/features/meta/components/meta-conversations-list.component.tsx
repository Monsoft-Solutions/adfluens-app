import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  Instagram,
  Facebook,
  Clock,
  Bot,
  User,
} from "lucide-react";
import {
  Badge,
  cn,
  Card,
  CardContent,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";

/**
 * List of conversations from Messenger and Instagram DMs
 */
export const MetaConversationsList: React.FC = () => {
  const trpc = useTRPC();
  const { organization } = useAuth();

  const { data, isLoading } = useQuery({
    ...trpc.meta.listConversations.queryOptions({ limit: 20 }),
    enabled: !!organization,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const conversations = data?.conversations || [];

  if (conversations.length === 0) {
    return (
      <div className="p-6 bg-muted/30 border border-border rounded-lg text-center">
        <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <h3 className="font-medium text-foreground mb-1">No Messages Yet</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Messages from Facebook Messenger and Instagram DMs will appear here.
          Make sure messaging is enabled for your connected pages.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">
          {conversations.length} Conversation
          {conversations.length !== 1 ? "s" : ""}
        </h3>
      </div>

      <div className="grid gap-2">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            className={cn(
              "overflow-hidden cursor-pointer hover:bg-muted/30 transition-colors",
              !conversation.isArchived && "border-l-2 border-l-primary"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  {conversation.participantProfilePic ? (
                    <AvatarImage
                      src={conversation.participantProfilePic}
                      alt={conversation.participantName || "User"}
                    />
                  ) : null}
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground truncate">
                        {conversation.participantName || "Unknown User"}
                      </h4>
                      {conversation.platform === "instagram" ? (
                        <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <Facebook className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {conversation.aiEnabled && (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {conversation.lastMessageAt
                          ? formatRelativeTime(
                              new Date(conversation.lastMessageAt)
                            )
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {conversation.lastMessagePreview || "No messages"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Format relative time (e.g., "2h ago", "Yesterday")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
