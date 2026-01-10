/**
 * Meta Team Inbox Component
 *
 * Displays conversations that need human attention with assignment,
 * status management, and chat interface.
 */

import { useState } from "react";
import { useTRPC } from "@/lib/trpc";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  ScrollArea,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from "@repo/ui";
import {
  Inbox,
  Loader2,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  Send,
  MoreVertical,
  Bot,
  ArrowLeft,
  Instagram,
  Facebook,
  Filter,
  RefreshCw,
} from "lucide-react";

type InboxItem = {
  id: string;
  conversationId: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignedToUserId: string | null;
  handoffReason: string | null;
  internalNotes: string | null;
  tags: string[] | null;
  createdAt: string;
  conversation: {
    participantName: string | null;
    participantProfilePic: string | null;
    platform: string;
    lastMessagePreview: string | null;
    lastMessageAt: string | null;
  } | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  open: {
    label: "Open",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: <Inbox className="w-3 h-3" />,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    icon: <Clock className="w-3 h-3" />,
  },
  waiting: {
    label: "Waiting",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    icon: <Clock className="w-3 h-3" />,
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-500/10 text-green-500 border-green-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  closed: {
    label: "Closed",
    color: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-500/10 text-gray-500" },
  normal: { label: "Normal", color: "bg-blue-500/10 text-blue-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-500/10 text-red-500" },
};

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return messageDate.toLocaleDateString();
}

export function MetaInbox() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // State
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [conversationDetailOpen, setConversationDetailOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Fetch inbox items (filtered by organization from context)
  const {
    data: inboxData,
    isLoading,
    refetch,
  } = useQuery({
    ...trpc.metaBot.listInbox.queryOptions({
      status:
        statusFilter === "all"
          ? undefined
          : (statusFilter as InboxItem["status"]),
      priority:
        priorityFilter === "all"
          ? undefined
          : (priorityFilter as InboxItem["priority"]),
      limit: 50,
    }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    ...trpc.metaBot.getInboxStats.queryOptions(),
  });

  // Fetch conversation detail when selected
  const { data: conversationDetail, isLoading: isLoadingConversation } =
    useQuery({
      ...trpc.meta.getConversation.queryOptions({
        conversationId: selectedItem?.conversationId || "",
      }),
      enabled: !!selectedItem?.conversationId && conversationDetailOpen,
    });

  // Mutations
  const updateStatusMutation = useMutation({
    ...trpc.metaBot.updateInboxStatus.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.metaBot.listInbox.queryKey({}),
      });
    },
  });

  const updatePriorityMutation = useMutation({
    ...trpc.metaBot.updateInboxPriority.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.metaBot.listInbox.queryKey({}),
      });
    },
  });

  const returnToBotMutation = useMutation({
    ...trpc.metaBot.returnToBot.mutationOptions(),
    onSuccess: () => {
      setConversationDetailOpen(false);
      setSelectedItem(null);
      queryClient.invalidateQueries({
        queryKey: trpc.metaBot.listInbox.queryKey({}),
      });
    },
  });

  const sendMessageMutation = useMutation({
    ...trpc.meta.sendMessage.mutationOptions(),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({
        queryKey: trpc.meta.getConversation.queryKey({
          conversationId: selectedItem?.conversationId || "",
        }),
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedItem?.conversationId) return;
    sendMessageMutation.mutate({
      conversationId: selectedItem.conversationId,
      text: newMessage,
    });
  };

  const items = inboxData?.items || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Inbox className="w-5 h-5" />
            Team Inbox
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Conversations that need human attention
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.open || 0}</div>
              <p className="text-sm text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.inProgress || 0}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.waiting || 0}</div>
              <p className="text-sm text-muted-foreground">Waiting</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">
                {stats.resolvedToday || 0}
              </div>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inbox List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <h3 className="font-medium mb-2">All caught up!</h3>
            <p className="text-sm text-muted-foreground">
              No conversations need attention right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                item.priority === "urgent" && "border-l-4 border-l-red-500",
                item.priority === "high" && "border-l-4 border-l-orange-500"
              )}
              onClick={() => {
                setSelectedItem(item as InboxItem);
                setConversationDetailOpen(true);
              }}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <Avatar className="w-10 h-10">
                    {item.conversation?.participantProfilePic && (
                      <AvatarImage
                        src={item.conversation.participantProfilePic}
                      />
                    )}
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {item.conversation?.participantName || "Unknown"}
                      </span>
                      {item.conversation?.platform === "instagram" ? (
                        <Instagram className="w-4 h-4 text-pink-500" />
                      ) : (
                        <Facebook className="w-4 h-4 text-blue-500" />
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          STATUS_CONFIG[item.status]?.color
                        )}
                      >
                        {STATUS_CONFIG[item.status]?.icon}
                        <span className="ml-1">
                          {STATUS_CONFIG[item.status]?.label}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          PRIORITY_CONFIG[item.priority]?.color
                        )}
                      >
                        {PRIORITY_CONFIG[item.priority]?.label}
                      </Badge>
                    </div>

                    {item.handoffReason && (
                      <p className="text-sm text-orange-600 mb-1">
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                        {item.handoffReason}
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground truncate">
                      {item.conversation?.lastMessagePreview || "No messages"}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(item.conversation?.lastMessageAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({
                            inboxId: item.id,
                            status: "in_progress",
                          });
                        }}
                      >
                        Mark In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatusMutation.mutate({
                            inboxId: item.id,
                            status: "resolved",
                          });
                        }}
                      >
                        Mark Resolved
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePriorityMutation.mutate({
                            inboxId: item.id,
                            priority: "urgent",
                          });
                        }}
                      >
                        Set Urgent
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePriorityMutation.mutate({
                            inboxId: item.id,
                            priority: "high",
                          });
                        }}
                      >
                        Set High Priority
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          returnToBotMutation.mutate({
                            conversationId: item.conversationId,
                          });
                        }}
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        Return to Bot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Conversation Detail Dialog */}
      <Dialog
        open={conversationDetailOpen}
        onOpenChange={setConversationDetailOpen}
      >
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConversationDetailOpen(false)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Avatar className="w-8 h-8">
                {selectedItem?.conversation?.participantProfilePic && (
                  <AvatarImage
                    src={selectedItem.conversation.participantProfilePic}
                  />
                )}
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <span>
                {selectedItem?.conversation?.participantName || "Conversation"}
              </span>
              {selectedItem?.conversation?.platform === "instagram" ? (
                <Instagram className="w-4 h-4 text-pink-500" />
              ) : (
                <Facebook className="w-4 h-4 text-blue-500" />
              )}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selectedItem && (
                <>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      STATUS_CONFIG[selectedItem.status]?.color
                    )}
                  >
                    {STATUS_CONFIG[selectedItem.status]?.label}
                  </Badge>
                  {selectedItem.handoffReason && (
                    <span className="text-orange-600 text-sm">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {selectedItem.handoffReason}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 border rounded-lg">
            {isLoadingConversation ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversationDetail?.conversation ? (
              <div className="space-y-4">
                {/* Show conversation info and last message preview */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Conversation Info</p>
                  <p className="text-sm text-muted-foreground">
                    Platform: {conversationDetail.conversation.platform}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Messages:{" "}
                    {conversationDetail.conversation.messageCount || 0}
                  </p>
                  {conversationDetail.conversation.lastMessageAt && (
                    <p className="text-sm text-muted-foreground">
                      Last message:{" "}
                      {formatRelativeTime(
                        conversationDetail.conversation.lastMessageAt
                      )}
                    </p>
                  )}
                </div>
                {/* Last message preview */}
                {conversationDetail.conversation.lastMessagePreview && (
                  <div className="bg-muted max-w-[80%] p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Last message:
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {conversationDetail.conversation.lastMessagePreview}
                    </p>
                  </div>
                )}
                <div className="text-center text-sm text-muted-foreground py-4">
                  Full message history will be available in a future update.
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No conversation data found
              </div>
            )}
          </ScrollArea>

          {/* Actions Bar */}
          <div className="flex items-center gap-2 pt-2">
            <Select
              value={selectedItem?.status || "open"}
              onValueChange={(value) => {
                if (selectedItem) {
                  updateStatusMutation.mutate({
                    inboxId: selectedItem.id,
                    status: value as InboxItem["status"],
                  });
                  setSelectedItem({
                    ...selectedItem,
                    status: value as InboxItem["status"],
                  });
                }
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedItem) {
                  returnToBotMutation.mutate({
                    conversationId: selectedItem.conversationId,
                  });
                }
              }}
              disabled={returnToBotMutation.isPending}
            >
              <Bot className="w-4 h-4 mr-2" />
              Return to Bot
            </Button>
          </div>

          {/* Message Input */}
          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              className="self-end"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
