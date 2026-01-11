/**
 * Badge List Component
 *
 * Reusable component for displaying a list of badges with overflow handling.
 * Used by entry-node and quick-replies-node to display keywords/replies.
 */

import { Badge } from "@repo/ui";

type BadgeListProps = {
  items: string[];
  limit?: number;
  primaryVariant?: "secondary" | "outline";
  overflowVariant?: "secondary" | "outline";
};

/**
 * Render a compact list of badges for the provided items and show a single overflow badge when there are more items than the limit.
 *
 * @param items - Array of strings to display as individual badges
 * @param limit - Maximum number of visible badges before showing an overflow badge (default: 3)
 * @param primaryVariant - Variant to use for visible badges (default: "outline")
 * @param overflowVariant - Variant to use for the overflow badge (default: "secondary")
 * @returns The badge list element, or `null` when `items` is empty
 */
export function BadgeList({
  items,
  limit = 3,
  primaryVariant = "outline",
  overflowVariant = "secondary",
}: BadgeListProps) {
  if (items.length === 0) return null;

  const visibleItems = items.slice(0, limit);
  const overflowCount = items.length - limit;

  return (
    <div className="flex flex-wrap gap-1">
      {visibleItems.map((item, i) => (
        <Badge key={i} variant={primaryVariant} className="text-xs">
          {item}
        </Badge>
      ))}
      {overflowCount > 0 && (
        <Badge variant={overflowVariant} className="text-xs">
          +{overflowCount}
          {limit === 4 ? " more" : ""}
        </Badge>
      )}
    </div>
  );
}