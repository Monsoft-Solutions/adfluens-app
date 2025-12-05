import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useSession } from "./auth.client";

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
 * Session type from Better Auth
 */
type Session = {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Auth context value type
 */
type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetchSession: () => Promise<void>;
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

  const value = useMemo<AuthContextValue>(() => {
    const hasSession = !!data?.session && !!data?.user && !error;

    return {
      user: hasSession ? (data.user as User) : null,
      session: hasSession ? (data.session as Session) : null,
      isLoading: isPending,
      isAuthenticated: hasSession,
      refetchSession,
    };
  }, [data, isPending, error, refetchSession]);

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
