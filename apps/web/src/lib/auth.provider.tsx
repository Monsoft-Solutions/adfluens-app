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
 * Note: The useActiveOrganization hook returns additional members/invitations
 * but we only need the core organization fields
 */
type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
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
  const { data: activeOrganization, isPending: isOrgPending } =
    authClient.useActiveOrganization();
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

  const hasSession = !!data?.session && !!data?.user && !error;
  const organizationData =
    hasSession && activeOrganization
      ? (activeOrganization as Organization)
      : null;

  /**
   * Auto-select first organization if user is authenticated but has no active organization
   * This handles the case when a new user signs up and their organization isn't auto-activated
   */
  useEffect(() => {
    const autoSelectOrganization = async () => {
      // Skip if already attempted, still loading, no session, or already has organization
      if (
        hasAttemptedAutoSelect.current ||
        isPending ||
        isOrgPending ||
        !hasSession ||
        organizationData
      ) {
        return;
      }

      hasAttemptedAutoSelect.current = true;

      try {
        // Fetch user's organizations (returns memberships with nested organization)
        const orgsResponse = await authClient.organization.list();
        const orgsData = orgsResponse.data;

        if (orgsData && orgsData.length > 0) {
          const firstItem = orgsData[0];

          // Extract organization ID from membership response
          // Note: list() returns memberships, so org is nested under 'organization' property
          // The 'id' at top level is the membership ID, NOT the organization ID
          const orgId =
            (firstItem as { organization?: { id: string } })?.organization
              ?.id ||
            (firstItem as { organizationId?: string })?.organizationId ||
            firstItem?.id; // Fallback to id only if others aren't present

          if (orgId) {
            // Set the first organization as active
            await authClient.organization.setActive({
              organizationId: orgId,
            });
            // Refetch to update the active organization state
            await refetch();
          }
        }
      } catch (err) {
        console.error("[auth] Failed to auto-select organization:", err);
      }
    };

    void autoSelectOrganization();
  }, [hasSession, organizationData, isPending, isOrgPending, refetch]);

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
      isLoading: isPending || isOrgPending,
      isAuthenticated: hasSession,
      refetchSession,
      setActiveOrganization,
    };
  }, [
    data,
    hasSession,
    organizationData,
    isPending,
    isOrgPending,
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
