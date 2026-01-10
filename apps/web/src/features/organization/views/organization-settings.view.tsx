import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Building2, AlertCircle } from "lucide-react";
import { useTRPC } from "@/lib/trpc";
import { useAuth } from "@/lib/auth.provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import {
  ProfileForm,
  type ProfileFormData,
} from "../components/profile-form.component";
import { BusinessInfoDisplay } from "../components/business-info-display.component";
import { GMBConnectionSettings } from "../components/gmb-connection-settings.component";

/**
 * Organization Settings view
 * Allows users to manage their organization profile (website, social links)
 * and view scraped business information
 */
export const OrganizationSettingsView: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { organization } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch organization profile
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: fetchError,
  } = useQuery({
    ...trpc.organization.getProfile.queryOptions(),
    enabled: !!organization,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    ...trpc.organization.updateProfile.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Profile saved successfully!");
      setError(null);
      // Invalidate the profile query to refresh data
      queryClient.invalidateQueries({
        queryKey: trpc.organization.getProfile.queryKey(),
      });
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to save profile");
      setSuccessMessage(null);
    },
  });

  // Rescrape mutation
  const rescrapeMutation = useMutation({
    ...trpc.organization.rescrapeWebsite.mutationOptions(),
    onSuccess: () => {
      setSuccessMessage("Website scraped successfully!");
      setError(null);
      queryClient.invalidateQueries({
        queryKey: trpc.organization.getProfile.queryKey(),
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    },
    onError: (err) => {
      setError(err.message || "Failed to scrape website");
      setSuccessMessage(null);
    },
  });

  const handleSubmit = async (data: ProfileFormData) => {
    setError(null);
    setSuccessMessage(null);

    await updateProfileMutation.mutateAsync({
      websiteUrl: data.websiteUrl || null,
      instagramUrl: data.instagramUrl || null,
      facebookUrl: data.facebookUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      twitterUrl: data.twitterUrl || null,
      linkedinUrl: data.linkedinUrl || null,
    });
  };

  const handleRescrape = () => {
    setError(null);
    setSuccessMessage(null);
    rescrapeMutation.mutate();
  };

  const profile = profileData?.profile;

  // No organization state
  if (!organization) {
    return (
      <div className="animate-reveal">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-muted rounded-lg p-6 mb-6 border border-border">
            <Building2 className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">
            No Organization Selected
          </h2>
          <p className="text-muted-foreground max-w-md">
            Please select or create an organization to manage settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-reveal">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-semibold text-foreground tracking-tight">
              Organization Settings
            </h1>
            <p className="text-muted-foreground">{organization.name}</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div
          className={cn(
            "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {(error || fetchError) && (
        <div
          className={cn(
            "bg-destructive/10 border border-destructive/20 text-destructive",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error || fetchError?.message}</p>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="profile">Profile & Links</TabsTrigger>
          <TabsTrigger value="business-info">Business Info</TabsTrigger>
          <TabsTrigger value="google-business">Google Business</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Website & Social Links</CardTitle>
              <CardDescription>
                Add your business website and social media profiles. Your
                website will be automatically scraped to extract business
                information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <ProfileForm
                  initialData={{
                    websiteUrl: profile?.websiteUrl ?? "",
                    instagramUrl: profile?.instagramUrl ?? "",
                    facebookUrl: profile?.facebookUrl ?? "",
                    tiktokUrl: profile?.tiktokUrl ?? "",
                    twitterUrl: profile?.twitterUrl ?? "",
                    linkedinUrl: profile?.linkedinUrl ?? "",
                  }}
                  onSubmit={handleSubmit}
                  isLoading={updateProfileMutation.isPending}
                  error={error}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Info Tab */}
        <TabsContent value="business-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scraped Business Information</CardTitle>
              <CardDescription>
                This information was automatically extracted from your website.
                Use the re-scrape button to refresh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessInfoDisplay
                data={profile?.scrapedData ?? null}
                scrapedAt={profile?.scrapedAt}
                isLoading={isLoadingProfile}
                onRescrape={profile?.websiteUrl ? handleRescrape : undefined}
                isRescraping={rescrapeMutation.isPending}
                error={rescrapeMutation.error?.message}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Business Tab */}
        <TabsContent value="google-business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Google Business Profile</CardTitle>
              <CardDescription>
                Connect your Google Business Profile to manage posts and respond
                to reviews directly from this app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GMBConnectionSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
