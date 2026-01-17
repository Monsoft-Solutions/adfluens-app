/**
 * Upload Tab Component
 *
 * File upload with drag and drop support.
 */

import { Loader2, Upload } from "lucide-react";
import { cn } from "@repo/ui";
import { useDragDrop } from "./use-drag-drop.hook";

type UploadTabProps = {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploadingFiles: boolean;
  uploadProgress: number;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTriggerFileInput: () => void;
  onFileDrop: (files: FileList) => void;
  remainingSlots: number;
};

export function UploadTab({
  fileInputRef,
  isUploadingFiles,
  uploadProgress,
  onFileSelect,
  onTriggerFileInput,
  onFileDrop,
  remainingSlots,
}: UploadTabProps) {
  const { isDragOver, dragProps } = useDragDrop({ onDrop: onFileDrop });

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
        multiple
        onChange={onFileSelect}
        className="hidden"
      />

      <div
        {...dragProps}
        onClick={onTriggerFileInput}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        {isUploadingFiles ? (
          <UploadingState progress={uploadProgress} />
        ) : (
          <IdleState />
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {remainingSlots} images remaining
      </p>
    </div>
  );
}

function UploadingState({ progress }: { progress: number }) {
  return (
    <div className="space-y-3">
      <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Uploading images...</p>
      {progress > 0 && (
        <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function IdleState() {
  return (
    <div className="space-y-3">
      <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">
          Drop images here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPEG, PNG, GIF, WebP, HEIC supported. Max 10MB per file.
        </p>
      </div>
    </div>
  );
}
