import React, { useState } from "react";
import { Search, AtSign, Loader2 } from "lucide-react";
import { Button, Input, Label, Card, CardContent, cn } from "@repo/ui";

type AnalyzerInputProps = {
  onAnalyze: (channelId: string) => void;
  isLoading: boolean;
};

/**
 * Analyzer input component for entering YouTube channel ID or handle
 * Uses shadcn/ui components for consistent styling
 */
export const AnalyzerInput: React.FC<AnalyzerInputProps> = ({
  onAnalyze,
  isLoading,
}) => {
  const [channelId, setChannelId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelId.trim()) {
      onAnalyze(channelId.trim());
    }
  };

  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full flex-1 space-y-2">
              <Label htmlFor="channelId" className="text-foreground">
                Channel Handle or ID
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  id="channelId"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className={cn("pl-10 h-11", "focus-visible:ring-primary")}
                  placeholder="e.g., @cgcosmetic or UC_x5X..."
                  required
                />
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <Button
                type="submit"
                disabled={isLoading || !channelId.trim()}
                variant="default"
                size="lg"
                className="w-full sm:w-auto min-w-[140px] bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            API keys are securely stored on the server. Just enter a channel
            handle or ID to get started.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
