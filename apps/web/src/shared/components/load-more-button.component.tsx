/**
 * Load More Button Component
 *
 * A reusable button for loading more paginated content.
 */

import type React from "react";
import { Loader2 } from "lucide-react";
import { Button, cn } from "@repo/ui";

type LoadMoreButtonProps = {
  /** Click handler to load more content */
  onClick: () => void;

  /** Whether content is currently loading */
  isLoading: boolean;

  /** Button label text */
  label?: string;

  /** Loading label text */
  loadingLabel?: string;

  /** Optional custom class name */
  className?: string;
};

export const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  onClick,
  isLoading,
  label = "Load More",
  loadingLabel = "Loading...",
  className,
}) => (
  <div className={cn("flex justify-center pt-4", className)}>
    <Button variant="outline" onClick={onClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  </div>
);
