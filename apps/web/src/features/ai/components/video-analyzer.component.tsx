import React, { useState, useEffect, useRef } from "react";
import type { YouTubeVideo } from "@repo/types/youtube/youtube-video.type";
import type { YouTubeComment } from "@repo/types/youtube/youtube-comment.type";
import type { ViralAnalysisResult } from "@repo/types/ai/viral-analysis-result.type";
import type { ChatMessage } from "@repo/types/ai/chat-message.type";
import { trpcClient } from "@/lib/trpc";
import {
  Sparkles,
  RefreshCw,
  MessageSquare,
  Send,
  Lightbulb,
  Zap,
  FileText,
  Bot,
  Play,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  ScrollArea,
  cn,
} from "@repo/ui";

type VideoAnalyzerProps = {
  video: YouTubeVideo;
  comments: YouTubeComment[];
};

/**
 * AI-powered video analysis component
 * Provides viral content analysis and interactive chat
 */
export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({
  video,
  comments,
}) => {
  const [analysis, setAnalysis] = useState<ViralAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = `video_analysis_${video.id}`;

  useEffect(() => {
    // Load from local storage if available
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAnalysis(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      setAnalysis(null);
    }
  }, [video.id, STORAGE_KEY]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleAnalyze = async (force = false) => {
    if (!force && analysis) return;

    setLoading(true);
    setError(null);

    try {
      const result = await trpcClient.ai.analyze.mutate({ video, comments });
      setAnalysis(result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      if (force) {
        setChatMessages([]);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to analyze video";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysis) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);

    try {
      // Convert internal chat format to Gemini history format
      const history = chatMessages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

      const { response } = await trpcClient.ai.chat.mutate({
        history,
        message: userMsg,
        video,
        analysis,
      });

      setChatMessages((prev) => [...prev, { role: "model", text: response }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-muted border-t-purple-600 rounded-full animate-spin"></div>
            <Sparkles className="w-8 h-8 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Analyzing Video Content...
          </h3>
          <p className="text-muted-foreground text-sm mt-3 text-center max-w-md leading-relaxed">
            Gemini is accessing the video page, analyzing the structure, and
            extracting viral insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 via-background to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-10 text-center">
          <div className="bg-background p-4 rounded-full inline-flex mb-6 shadow-md ring-4 ring-purple-100 dark:ring-purple-900">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Uncover Viral Secrets
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-base">
            Use AI to analyze why this video worked. We&apos;ll use Google
            Search grounding to understand the video content and generate
            actionable ideas.
          </p>
          <Button
            onClick={() => handleAnalyze()}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-200 dark:shadow-purple-900/50"
          >
            <Play className="w-5 h-5 fill-current" />
            Analyze Video Strategy
          </Button>
          {error && (
            <div className="mt-6 flex justify-center">
              <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 px-4 py-2 rounded-lg">
                {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="border-border/50">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Viral Analysis Report
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Generated by Gemini 2.5 Flash
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => handleAnalyze(true)}
            className="text-muted-foreground hover:text-purple-600 hover:bg-purple-50 hover:border-purple-200"
          >
            <RefreshCw className="w-4 h-4" />
            Re-Analyze
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Static Analysis */}
        <div className="space-y-6">
          {/* Summary */}
          <Card className="hover:shadow-md transition-shadow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4 text-blue-500" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed text-sm border-l-2 border-blue-500 pl-4">
                {analysis.summary}
              </p>
            </CardContent>
          </Card>

          {/* Hooks & Reasons */}
          <Card className="hover:shadow-md transition-shadow border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-amber-500" />
                Viral Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                  The Hooks (Attention Grabbers)
                </span>
                <ul className="space-y-2">
                  {analysis.hooks.map((hook, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-foreground bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/50"
                    >
                      <span className="text-amber-500 font-bold">•</span>
                      {hook}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Why It Went Viral (Psychology)
                </span>
                <ul className="space-y-2">
                  {analysis.viralReasons.map((reason, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-foreground bg-purple-50 dark:bg-purple-950/30 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/50"
                    >
                      <span className="text-purple-500 font-bold">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Ideas */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground">
                <Lightbulb className="w-4 h-4 text-emerald-600" />
                Content Ideas for You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.contentIdeas.map((idea, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-foreground bg-background/80 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{idea}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Sources / Grounding */}
          {analysis.sources && analysis.sources.length > 0 && (
            <Card className="bg-muted/50 border-border/50">
              <CardContent className="p-4">
                <h3 className="font-bold text-muted-foreground mb-2 text-xs uppercase tracking-wider">
                  Sources Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-background px-2 py-1 rounded border border-border"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {source.title}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Chat */}
        <Card className="lg:h-full lg:min-h-[600px] flex flex-col overflow-hidden border-border/50">
          <CardHeader className="p-4 border-b border-border bg-muted/50 flex-row items-center gap-3 space-y-0">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm">Strategy Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">
                Ask questions about this video&apos;s performance
              </p>
            </div>
          </CardHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-5">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground space-y-4 p-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 opacity-20" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      No questions yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try asking: &quot;How can I apply this hook to my
                      niche?&quot;
                    </p>
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm",
                      msg.role === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none border border-border"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3 border border-border">
                    <div className="flex gap-1.5 items-center h-5">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                      <span
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-border bg-muted/50"
          >
            <div className="relative">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="pr-12 bg-background"
                disabled={chatLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!chatInput.trim() || chatLoading}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 bg-purple-600 hover:bg-purple-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
