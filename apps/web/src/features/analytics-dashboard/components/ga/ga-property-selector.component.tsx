import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  cn,
  toast,
} from "@repo/ui";
import { useTRPC, trpcClient } from "@/lib/trpc";

type GAPropertySelectorProps = {
  setupCode: string;
  onComplete: () => void;
  onCancel: () => void;
};

/**
 * Property selector for Google Analytics
 * Shows available GA4 properties and allows selection
 */
export const GAPropertySelector: React.FC<GAPropertySelectorProps> = ({
  setupCode,
  onComplete,
  onCancel,
}) => {
  const trpc = useTRPC();
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<
    string | null
  >(null);

  const {
    data: propertiesData,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    ...trpc.ga.listProperties.queryOptions({ setupCode }),
    enabled: !!setupCode,
  });

  const properties = propertiesData?.properties;

  const selectMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      const property = properties?.find((p) => p.name === propertyId);
      if (!property) throw new Error("Property not found");

      await trpcClient.ga.selectProperty.mutate({
        setupCode,
        propertyId: property.name,
        propertyName: property.displayName,
      });
    },
    onSuccess: () => {
      onComplete();
    },
    onError: (error) => {
      toast.error("Failed to connect property", {
        description:
          error instanceof Error ? error.message : "Please try again",
      });
    },
  });

  const { error: mutationError, isPending: isMutating } = selectMutation;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Property</CardTitle>
          <CardDescription>Loading your GA4 properties...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (queryError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Properties</CardTitle>
          <CardDescription>
            Failed to load your GA4 properties. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
            <p className="text-sm text-destructive">
              {queryError instanceof Error
                ? queryError.message
                : "An unknown error occurred"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Go Back
            </Button>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Properties Found</CardTitle>
          <CardDescription>
            No GA4 properties were found for this Google account. Make sure you
            have access to at least one GA4 property.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onCancel}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Select a GA4 Property
        </CardTitle>
        <CardDescription>
          Choose which property you want to track. You can change this later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {properties.map((property) => (
            <button
              key={property.name}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-lg border transition-colors text-left",
                selectedPropertyId === property.name
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                isMutating && "opacity-50 cursor-not-allowed"
              )}
              onClick={() =>
                !isMutating && setSelectedPropertyId(property.name)
              }
              disabled={isMutating}
            >
              <div>
                <p className="font-medium text-foreground">
                  {property.displayName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {property.name.replace("properties/", "Property ID: ")}
                </p>
                {property.timeZone && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Timezone: {property.timeZone}
                  </p>
                )}
              </div>
              {selectedPropertyId === property.name && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </div>

        {mutationError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mt-4">
            <p className="text-sm font-medium text-destructive mb-1">
              Failed to Connect Property
            </p>
            <p className="text-sm text-destructive/80">
              {mutationError instanceof Error
                ? mutationError.message
                : "An unknown error occurred"}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onCancel} disabled={isMutating}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              selectedPropertyId && selectMutation.mutate(selectedPropertyId)
            }
            disabled={!selectedPropertyId || isMutating}
          >
            {isMutating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Property"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
