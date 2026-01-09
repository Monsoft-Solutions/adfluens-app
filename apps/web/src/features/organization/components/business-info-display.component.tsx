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
  MessageSquare,
  Trophy,
  TrendingUp,
  DollarSign,
  Star,
  Lightbulb,
} from "lucide-react";
import { Button, Badge, cn } from "@repo/ui";
import type { OrganizationProfile } from "@repo/types/organization/organization-profile.type";

type BusinessInfoDisplayProps = {
  data: OrganizationProfile | null;
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

      {/* Brand Voice */}
      {data.brandVoice && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Brand Voice
          </h4>
          <div className="space-y-3">
            {data.brandVoice.tone && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Tone
                </p>
                <Badge variant="outline">{data.brandVoice.tone}</Badge>
              </div>
            )}
            {data.brandVoice.personality &&
              data.brandVoice.personality.length > 0 && (
                <BadgeList
                  icon={<Lightbulb className="w-4 h-4" />}
                  label="Personality"
                  items={data.brandVoice.personality}
                />
              )}
            {data.brandVoice.communicationStyle && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Communication Style
                </p>
                <p className="text-sm text-foreground">
                  {data.brandVoice.communicationStyle}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target Audience */}
      {data.targetAudience && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Target Audience
          </h4>
          <div className="space-y-3">
            {data.targetAudience.demographics &&
              data.targetAudience.demographics.length > 0 && (
                <BadgeList
                  icon={<Users className="w-4 h-4" />}
                  label="Demographics"
                  items={data.targetAudience.demographics}
                />
              )}
            {data.targetAudience.painPoints &&
              data.targetAudience.painPoints.length > 0 && (
                <BadgeList
                  icon={<AlertCircle className="w-4 h-4" />}
                  label="Pain Points"
                  items={data.targetAudience.painPoints}
                />
              )}
            {data.targetAudience.aspirations &&
              data.targetAudience.aspirations.length > 0 && (
                <BadgeList
                  icon={<Star className="w-4 h-4" />}
                  label="Aspirations"
                  items={data.targetAudience.aspirations}
                />
              )}
            {data.targetAudience.segments &&
              data.targetAudience.segments.length > 0 && (
                <BadgeList
                  icon={<Target className="w-4 h-4" />}
                  label="Segments"
                  items={data.targetAudience.segments}
                />
              )}
          </div>
        </div>
      )}

      {/* Competitive Positioning */}
      {data.competitivePositioning && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Competitive Positioning
          </h4>
          <div className="space-y-3">
            {data.competitivePositioning.marketPosition && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Market Position
                </p>
                <Badge variant="outline">
                  {data.competitivePositioning.marketPosition}
                </Badge>
              </div>
            )}
            {data.competitivePositioning.uniqueDifferentiators &&
              data.competitivePositioning.uniqueDifferentiators.length > 0 && (
                <BadgeList
                  icon={<Sparkles className="w-4 h-4" />}
                  label="Unique Differentiators"
                  items={data.competitivePositioning.uniqueDifferentiators}
                />
              )}
            {data.competitivePositioning.competitiveAdvantages &&
              data.competitivePositioning.competitiveAdvantages.length > 0 && (
                <BadgeList
                  icon={<Trophy className="w-4 h-4" />}
                  label="Competitive Advantages"
                  items={data.competitivePositioning.competitiveAdvantages}
                />
              )}
          </div>
        </div>
      )}

      {/* Content Themes */}
      {data.contentThemes && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Content Themes
          </h4>
          <div className="space-y-3">
            {data.contentThemes.mainTopics &&
              data.contentThemes.mainTopics.length > 0 && (
                <BadgeList
                  icon={<Target className="w-4 h-4" />}
                  label="Main Topics"
                  items={data.contentThemes.mainTopics}
                />
              )}
            {data.contentThemes.contentPillars &&
              data.contentThemes.contentPillars.length > 0 && (
                <BadgeList
                  icon={<Briefcase className="w-4 h-4" />}
                  label="Content Pillars"
                  items={data.contentThemes.contentPillars}
                />
              )}
            {data.contentThemes.keywords &&
              data.contentThemes.keywords.length > 0 && (
                <BadgeList
                  icon={<Sparkles className="w-4 h-4" />}
                  label="Keywords"
                  items={data.contentThemes.keywords}
                />
              )}
          </div>
        </div>
      )}

      {/* Business Model */}
      {data.businessModel && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Business Model
          </h4>
          <div className="space-y-3">
            {data.businessModel.monetization && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Monetization
                </p>
                <p className="text-sm text-foreground">
                  {data.businessModel.monetization}
                </p>
              </div>
            )}
            {data.businessModel.pricingTiers &&
              data.businessModel.pricingTiers.length > 0 && (
                <BadgeList
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Pricing Tiers"
                  items={data.businessModel.pricingTiers}
                />
              )}
            {data.businessModel.customerJourney && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Customer Journey
                </p>
                <p className="text-sm text-foreground">
                  {data.businessModel.customerJourney}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Proof */}
      {data.socialProof && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Social Proof
          </h4>
          <div className="space-y-3">
            {data.socialProof.awards && data.socialProof.awards.length > 0 && (
              <BadgeList
                icon={<Trophy className="w-4 h-4" />}
                label="Awards"
                items={data.socialProof.awards}
              />
            )}
            {data.socialProof.certifications &&
              data.socialProof.certifications.length > 0 && (
                <BadgeList
                  icon={<Star className="w-4 h-4" />}
                  label="Certifications"
                  items={data.socialProof.certifications}
                />
              )}
            {data.socialProof.testimonialThemes &&
              data.socialProof.testimonialThemes.length > 0 && (
                <BadgeList
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Testimonial Themes"
                  items={data.socialProof.testimonialThemes}
                />
              )}
            {data.socialProof.caseStudyHighlights &&
              data.socialProof.caseStudyHighlights.length > 0 && (
                <BadgeList
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Case Study Highlights"
                  items={data.socialProof.caseStudyHighlights}
                />
              )}
          </div>
        </div>
      )}
    </div>
  );
};
