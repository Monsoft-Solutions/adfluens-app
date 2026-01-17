/**
 * useDragDrop Hook
 *
 * Manages drag and drop state and handlers for file uploads.
 */

import { useState, useCallback } from "react";

type UseDragDropOptions = {
  onDrop: (files: FileList) => void;
};

export function useDragDrop({ onDrop }: UseDragDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop]
  );

  return {
    isDragOver,
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
}
