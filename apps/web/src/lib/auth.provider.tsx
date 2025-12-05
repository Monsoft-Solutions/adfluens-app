import React, { createContext, useContext, useMemo, useCallback } from "react";
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

  const value = useMemo<AuthContextValue>(() => {
    const hasSession = !!data?.session && !!data?.user && !error;
    const sessionData = hasSession ? (data.session as Session) : null;
    // Organization data may be included in session response when organization plugin is active
    // If not present, it will be null and can be fetched separately if needed
    const sessionResponse = data as
      | { organization?: Organization }
      | null
      | undefined;
    const organizationData =
      hasSession && sessionResponse?.organization
        ? (sessionResponse.organization as Organization)
        : null;

    return {
      user: hasSession ? (data.user as User) : null,
      session: sessionData,
      organization: organizationData,
      isLoading: isPending,
      isAuthenticated: hasSession,
      refetchSession,
      setActiveOrganization,
    };
  }, [data, isPending, error, refetchSession, setActiveOrganization]);

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
