import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import {
  VIDEO_SORT_OPTIONS,
  VIDEO_SORT_LABELS,
  type VideoSortOption,
} from "@repo/types/youtube/video-sort-option.enum";

type SortSelectProps = {
  value: VideoSortOption;
  onChange: (value: VideoSortOption) => void;
  disabled?: boolean;
};

/**
 * Sort selection dropdown component
 * Allows users to select how video results are sorted
 */
export const SortSelect: React.FC<SortSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {Object.values(VIDEO_SORT_OPTIONS).map((option) => (
          <SelectItem key={option} value={option}>
            {VIDEO_SORT_LABELS[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
