/**
 * AI Prompt Step Component
 *
 * Step 2 of AI image generation - prompt review and editing.
 */

import { ImageIcon } from "lucide-react";
import { Textarea } from "@repo/ui";
import { StepIndicator } from "./step-indicator.component";

type AiPromptStepProps = {
  imagePrompt: string;
  onImagePromptChange: (value: string) => void;
  hasPrompt: boolean;
  hasGeneratedImages: boolean;
};

export function AiPromptStep({
  imagePrompt,
  onImagePromptChange,
  hasPrompt,
  hasGeneratedImages,
}: AiPromptStepProps) {
  return (
    <div className="space-y-3">
      <StepIndicator
        step={2}
        title="Review & edit prompt"
        icon={<ImageIcon className="w-4 h-4" />}
        isComplete={hasPrompt && hasGeneratedImages}
        isActive={hasPrompt && !hasGeneratedImages}
      />
      <div className="pl-8 space-y-3">
        <Textarea
          placeholder="Type your prompt directly or click 'Optimize' above to generate one..."
          value={imagePrompt}
          onChange={(e) => onImagePromptChange(e.target.value)}
          rows={3}
          className="font-mono text-sm resize-none"
        />
      </div>
    </div>
  );
}
