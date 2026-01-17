/**
 * AI Idea Step Component
 *
 * Step 1 of AI image generation - idea input and optimization.
 */

import { Loader2, Wand2, ChevronDown, Palette, Lightbulb } from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@repo/ui";
import { StepIndicator } from "./step-indicator.component";
import { StyleOptions } from "./style-options.component";

type AiIdeaStepProps = {
  ideaInput: string;
  onIdeaInputChange: (value: string) => void;
  isOptimizing: boolean;
  onOptimize: () => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (show: boolean) => void;
  imageStyle?: string;
  onImageStyleChange: (value: string | undefined) => void;
  imageMood?: string;
  onImageMoodChange: (value: string | undefined) => void;
  imageComposition?: string;
  onImageCompositionChange: (value: string | undefined) => void;
  hasPrompt: boolean;
};

export function AiIdeaStep({
  ideaInput,
  onIdeaInputChange,
  isOptimizing,
  onOptimize,
  showAdvanced,
  onShowAdvancedChange,
  imageStyle,
  onImageStyleChange,
  imageMood,
  onImageMoodChange,
  imageComposition,
  onImageCompositionChange,
  hasPrompt,
}: AiIdeaStepProps) {
  const styleCount = [imageStyle, imageMood, imageComposition].filter(
    Boolean
  ).length;

  return (
    <div className="space-y-3">
      <StepIndicator
        step={1}
        title="Describe your idea"
        icon={<Lightbulb className="w-4 h-4" />}
        isComplete={hasPrompt}
        isActive={!hasPrompt}
      />
      <div className="pl-8 space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., sunset on a beach, product photo, cozy cafe..."
            value={ideaInput}
            onChange={(e) => onIdeaInputChange(e.target.value)}
            className="flex-1"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onOptimize}
                  disabled={!ideaInput.trim() || isOptimizing}
                  className="whitespace-nowrap"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Optimize
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Turn your idea into a detailed image prompt</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <button
          type="button"
          onClick={() => onShowAdvancedChange(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              showAdvanced && "rotate-180"
            )}
          />
          <Palette className="w-4 h-4" />
          Customize Style
          {styleCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {styleCount} set
            </Badge>
          )}
        </button>

        {showAdvanced && (
          <StyleOptions
            imageStyle={imageStyle}
            onImageStyleChange={onImageStyleChange}
            imageMood={imageMood}
            onImageMoodChange={onImageMoodChange}
            imageComposition={imageComposition}
            onImageCompositionChange={onImageCompositionChange}
          />
        )}
      </div>
    </div>
  );
}
