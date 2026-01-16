import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui";

type TopPage = {
  pagePath: string;
  pageviews: number;
  avgTimeOnPage: number;
};

type GATopPagesTableProps = {
  pages: TopPage[];
};

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Table showing top pages from Google Analytics
 */
export const GATopPagesTable: React.FC<GATopPagesTableProps> = ({ pages }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Page Path</TableHead>
          <TableHead className="text-right">Pageviews</TableHead>
          <TableHead className="text-right">Avg. Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.map((page, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">
              <span className="truncate max-w-md block" title={page.pagePath}>
                {page.pagePath}
              </span>
            </TableCell>
            <TableCell className="text-right">
              {page.pageviews.toLocaleString()}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatDuration(page.avgTimeOnPage)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
