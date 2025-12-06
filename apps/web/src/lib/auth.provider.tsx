import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useSession, authClient } from "@repo/auth/client";

/**
 * User type from Better Auth session
 */
type User = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Organization type from Better Auth
 */
type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Session type from Better Auth
 */
type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string | null;
};

/**
 * Auth context value type
 */
type AuthContextValue = {
  user: User | null;
  session: Session | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchSession: () => Promise<void>;
  setActiveOrganization: (organizationId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * AuthProvider component
 * Wraps the application and provides authentication state via context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data, isPending, error, refetch } = useSession();
  const hasAttemptedAutoSelect = useRef(false);

  /**
   * Refetch the session data
   * Call this after sign-in/sign-up to update the auth state
   */
  const refetchSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * Set active organization
   * Updates the session to use the specified organization
   */
  const setActiveOrganization = useCallback(
    async (organizationId: string) => {
      await authClient.organization.setActive({
        organizationId,
      });
      await refetch();
    },
    [refetch]
  );

  // Extract organization data from session response
  const sessionResponse = data as
    | { organization?: Organization }
    | null
    | undefined;
  const hasSession = !!data?.session && !!data?.user && !error;
  const organizationData =
    hasSession && sessionResponse?.organization
      ? (sessionResponse.organization as Organization)
      : null;

  /**
   * Auto-select first organization if user is authenticated but has no active organization
   * This handles the case when a new user signs up and their organization isn't auto-activated
   */
  useEffect(() => {
    const autoSelectOrganization = async () => {
      console.log("[auth] Auto-select check:", {
        hasAttemptedAutoSelect: hasAttemptedAutoSelect.current,
        isPending,
        hasSession,
        organizationData,
      });

      // Skip if already attempted, still loading, no session, or already has organization
      if (
        hasAttemptedAutoSelect.current ||
        isPending ||
        !hasSession ||
        organizationData
      ) {
        return;
      }

      hasAttemptedAutoSelect.current = true;
      console.log("[auth] Attempting to auto-select organization...");

      try {
        // Log available organization methods
        console.log(
          "[auth] Available organization methods:",
          Object.keys(authClient.organization)
        );

        // Fetch user's organizations (returns memberships with organization data)
        const orgsResponse = await authClient.organization.list();
        console.log("[auth] Organizations list response:", orgsResponse);
        console.log(
          "[auth] Response data:",
          JSON.stringify(orgsResponse, null, 2)
        );

        // Handle the response - it might be memberships array or organizations array
        const orgsData = orgsResponse.data;
        if (orgsData && orgsData.length > 0) {
          const firstItem = orgsData[0];
          console.log("[auth] First item from list:", firstItem);

          // Extract organization ID - could be direct org or membership with org
          const orgId =
            firstItem?.id ||
            (firstItem as { organization?: { id: string } })?.organization
              ?.id ||
            (firstItem as { organizationId?: string })?.organizationId;

          console.log("[auth] Organization ID to select:", orgId);

          if (orgId) {
            // Set the first organization as active
            const setActiveResult = await authClient.organization.setActive({
              organizationId: orgId,
            });
            console.log("[auth] Set active result:", setActiveResult);
            // Refetch session to get updated organization data
            await refetch();
            console.log("[auth] Session refetched after setting org active");
          }
        } else {
          console.warn("[auth] No organizations found for user");
        }
      } catch (err) {
        console.error("[auth] Failed to auto-select organization:", err);
      }
    };

    void autoSelectOrganization();
  }, [hasSession, organizationData, isPending, refetch]);

  // Reset the auto-select flag when user logs out
  useEffect(() => {
    if (!hasSession) {
      hasAttemptedAutoSelect.current = false;
    }
  }, [hasSession]);

  const value = useMemo<AuthContextValue>(() => {
    const sessionData = hasSession ? (data?.session as Session) : null;

    return {
      user: hasSession ? (data?.user as User) : null,
      session: sessionData,
      organization: organizationData,
      isLoading: isPending,
      isAuthenticated: hasSession,
      refetchSession,
      setActiveOrganization,
    };
  }, [
    data,
    hasSession,
    organizationData,
    isPending,
    refetchSession,
    setActiveOrganization,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook
 * Provides access to authentication state anywhere in the app
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
