import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

type DateRangeSelectorProps = {
  value: number;
  onChange: (days: number) => void;
};

const DATE_RANGES = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 60, label: "Last 60 days" },
  { value: 90, label: "Last 90 days" },
];

/**
 * Date range selector for analytics
 */
export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DATE_RANGES.map((range) => (
          <SelectItem key={range.value} value={String(range.value)}>
            {range.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
