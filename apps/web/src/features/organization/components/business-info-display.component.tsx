import React from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Briefcase,
  Target,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button, Badge, cn } from "@repo/ui";

/**
 * Scraped business information type
 * Matches the ScrapedBusinessInfo from @repo/scraper
 */
type ScrapedBusinessInfo = {
  businessName?: string;
  description?: string;
  industry?: string;
  services?: string[];
  products?: string[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  location?: string;
  foundedYear?: string;
  teamSize?: string;
  valuePropositions?: string[];
  targetAudience?: string[];
  rawContent?: string;
};

type BusinessInfoDisplayProps = {
  data: ScrapedBusinessInfo | null;
  scrapedAt?: Date | string | null;
  isLoading?: boolean;
  onRescrape?: () => void;
  isRescraping?: boolean;
  error?: string | null;
};

/**
 * Info row component for displaying key-value pairs
 */
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}> = ({ icon, label, value }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
};

/**
 * Badge list component for displaying arrays of values
 */
const BadgeList: React.FC<{
  icon: React.ReactNode;
  label: string;
  items?: string[] | null;
}> = ({ icon, label, items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
};

/**
 * Component to display scraped business information
 */
export const BusinessInfoDisplay: React.FC<BusinessInfoDisplayProps> = ({
  data,
  scrapedAt,
  isLoading,
  onRescrape,
  isRescraping,
  error,
}) => {
  // Format scraped date
  const formattedDate = scrapedAt
    ? new Date(scrapedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading business information...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "bg-destructive/10 border border-destructive/20 text-destructive",
          "px-4 py-3 rounded-lg flex items-center gap-3"
        )}
      >
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Empty state
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted rounded-lg p-4 mb-4 border border-border">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No Business Information
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          Add a website URL and save to automatically scrape your business
          information.
        </p>
        {onRescrape && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRescrape}
            disabled={isRescraping}
          >
            {isRescraping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Scrape Now
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with rescrape button */}
      <div className="flex items-center justify-between">
        <div>
          {data.businessName && (
            <h3 className="text-lg font-semibold text-foreground">
              {data.businessName}
            </h3>
          )}
          {formattedDate && (
            <p className="text-xs text-muted-foreground mt-1">
              Last scraped: {formattedDate}
            </p>
          )}
        </div>
        {onRescrape && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRescrape}
            disabled={isRescraping}
          >
            {isRescraping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-scrape
              </>
            )}
          </Button>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-foreground leading-relaxed">
            {data.description}
          </p>
        </div>
      )}

      {/* Industry badge */}
      {data.industry && (
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <Badge variant="outline">{data.industry}</Badge>
        </div>
      )}

      {/* Contact Information */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Contact Information
        </h4>
        <div className="divide-y divide-border">
          <InfoRow
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={data.contactEmail}
          />
          <InfoRow
            icon={<Phone className="w-4 h-4" />}
            label="Phone"
            value={data.contactPhone}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Address"
            value={data.address}
          />
          <InfoRow
            icon={<MapPin className="w-4 h-4" />}
            label="Location"
            value={data.location}
          />
        </div>
      </div>

      {/* Company Details */}
      <div className="border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground mb-3">
          Company Details
        </h4>
        <div className="divide-y divide-border">
          <InfoRow
            icon={<Calendar className="w-4 h-4" />}
            label="Founded"
            value={data.foundedYear}
          />
          <InfoRow
            icon={<Users className="w-4 h-4" />}
            label="Team Size"
            value={data.teamSize}
          />
        </div>
      </div>

      {/* Services */}
      <div className="border-t border-border pt-4">
        <BadgeList
          icon={<Sparkles className="w-4 h-4" />}
          label="Services"
          items={data.services}
        />
      </div>

      {/* Products */}
      {data.products && data.products.length > 0 && (
        <div className="border-t border-border pt-4">
          <BadgeList
            icon={<Briefcase className="w-4 h-4" />}
            label="Products"
            items={data.products}
          />
        </div>
      )}

      {/* Value Propositions */}
      {data.valuePropositions && data.valuePropositions.length > 0 && (
        <div className="border-t border-border pt-4">
          <BadgeList
            icon={<Target className="w-4 h-4" />}
            label="Value Propositions"
            items={data.valuePropositions}
          />
        </div>
      )}
    </div>
  );
};
