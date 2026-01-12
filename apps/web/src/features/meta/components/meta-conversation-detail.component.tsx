import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Instagram,
  Facebook,
  Bot,
  Send,
  Loader2,
  User,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
  Button,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  ScrollArea,
  cn,
} from "@repo/ui";
import { useTRPC } from "@/lib/trpc";

type MetaMessage = {
  id: string;
  timestamp: string;
  senderId: string;
  senderName?: string;
  isFromPage: boolean;
  text?: string;
  attachments?: Array<{ type: string; url?: string }>;
  isAiGenerated?: boolean;
};

type MetaConversationDetailProps = {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Modal dialog showing conversation details and message history
 */
export const MetaConversationDetail: React.FC<MetaConversationDetailProps> = ({
  conversationId,
  open,
  onOpenChange,
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation details
  const { data, isLoading } = useQuery({
    ...trpc.meta.getConversation.queryOptions({ conversationId }),
    enabled: open && !!conversationId,
  });

  const conversation = data?.conversation;

  // Send message mutation
  const sendMessageMutation = useMutation(
    trpc.meta.sendMessage.mutationOptions({
      onSuccess: () => {
        setMessageText("");
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ["meta", "getConversation"],
        });
        queryClient.invalidateQueries({
          queryKey: ["meta", "listConversations"],
        });
      },
    })
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.recentMessages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      conversationId,
      text: messageText.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if the 7-day messaging window is still open
  // Using HUMAN_AGENT tag extends the window from 24 hours to 7 days
  const isWindowExpired = useMemo(() => {
    const messages = (conversation?.recentMessages as MetaMessage[]) || [];

    if (!messages.length) return false;

    // Find the last message FROM the user (not from the page)
    const lastUserMessage = [...messages].reverse().find((m) => !m.isFromPage);

    if (!lastUserMessage) return true; // No user messages, window expired

    const lastUserMessageTime = new Date(lastUserMessage.timestamp).getTime();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return now - lastUserMessageTime > sevenDays;
  }, [conversation?.recentMessages]);

  const messages = (conversation?.recentMessages as MetaMessage[]) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {conversation?.participantProfilePic ? (
                  <AvatarImage
                    src={conversation.participantProfilePic}
                    alt={conversation.participantName || "User"}
                  />
                ) : null}
                <AvatarFallback>
                  <User className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-base flex items-center gap-2">
                  {conversation?.participantName || "Unknown User"}
                  {conversation?.platform === "instagram" ? (
                    <Instagram className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Facebook className="w-4 h-4 text-muted-foreground" />
                  )}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                  {conversation?.aiEnabled && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                    >
                      <Bot className="w-3 h-3 mr-1" />
                      AI Enabled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-3">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t shrink-0">
          {isWindowExpired && (
            <div className="flex items-start gap-2 p-3 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p className="font-medium">7-day window expired</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Meta only allows replies within 7 days of the user&apos;s last
                  message. You can respond when the user messages you again.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isWindowExpired
                  ? "Messaging window expired..."
                  : "Type a message..."
              }
              maxLength={2000}
              disabled={sendMessageMutation.isPending || isWindowExpired}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                !messageText.trim() ||
                sendMessageMutation.isPending ||
                isWindowExpired
              }
              size="icon"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          {sendMessageMutation.isError && (
            <p className="text-sm text-destructive mt-2">
              {sendMessageMutation.error?.message?.includes(
                "outside of allowed window"
              )
                ? "Cannot reply - the 7-day messaging window has expired."
                : "Failed to send message. Please try again."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Individual message bubble
 */
const MessageBubble: React.FC<{ message: MetaMessage }> = ({ message }) => {
  const isFromPage = message.isFromPage;

  return (
    <div className={cn("flex", isFromPage ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "rounded-lg px-3 py-2 max-w-[75%]",
          isFromPage
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {message.text && (
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-1 space-y-1">
            {message.attachments.map((attachment, idx) => (
              <div
                key={idx}
                className={cn(
                  "text-xs",
                  isFromPage
                    ? "text-primary-foreground/70"
                    : "text-muted-foreground"
                )}
              >
                [{attachment.type}]
              </div>
            ))}
          </div>
        )}

        {/* Timestamp and AI badge */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1 text-xs",
            isFromPage ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatMessageTime(new Date(message.timestamp))}
          {message.isAiGenerated && (
            <Badge
              variant="outline"
              className={cn(
                "ml-1 text-[10px] px-1 py-0",
                isFromPage
                  ? "border-primary-foreground/30 text-primary-foreground/70"
                  : "border-muted-foreground/30"
              )}
            >
              <Bot className="w-2.5 h-2.5 mr-0.5" />
              AI
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Format message timestamp
 */
function formatMessageTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
