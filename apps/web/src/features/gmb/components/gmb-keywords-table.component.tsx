import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";
import type { GMBSearchKeyword } from "@repo/types/gmb/gmb-performance.type";

type Props = {
  keywords: GMBSearchKeyword[];
  limit?: number;
};

/**
 * GMB Keywords Table Component
 *
 * Displays a table of top search keywords with their impression counts.
 */
export const GMBKeywordsTable: React.FC<Props> = ({ keywords, limit = 10 }) => {
  // Take top keywords by impressions (already sorted by API)
  const topKeywords = useMemo(
    () => keywords.slice(0, limit),
    [keywords, limit]
  );

  // Calculate total impressions for percentage
  const totalImpressions = useMemo(
    () => keywords.reduce((sum, k) => sum + k.impressions, 0),
    [keywords]
  );

  if (topKeywords.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        No search keyword data available for this period
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Keyword</TableHead>
          <TableHead className="text-right w-32">Impressions</TableHead>
          <TableHead className="text-right w-24">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topKeywords.map((keyword, index) => {
          const percentage =
            totalImpressions > 0
              ? ((keyword.impressions / totalImpressions) * 100).toFixed(1)
              : "0.0";

          return (
            <TableRow key={keyword.keyword}>
              <TableCell className="text-muted-foreground font-mono text-sm">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium">{keyword.keyword}</TableCell>
              <TableCell className="text-right tabular-nums">
                {keyword.impressions.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (keyword.impressions / (topKeywords[0]?.impressions || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right tabular-nums">
                    {percentage}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
