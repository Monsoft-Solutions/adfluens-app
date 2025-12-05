import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button, Input, cn } from "@repo/ui";

type SearchInputProps = {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
};

/**
 * Search input component with submit button
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  isLoading = false,
  placeholder = "Search for videos...",
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "pl-11 h-12 text-base",
            "bg-background border-border",
            "focus-visible:ring-primary/20 focus-visible:border-primary"
          )}
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="h-12 px-6 font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Search
          </>
        )}
      </Button>
    </form>
  );
};
