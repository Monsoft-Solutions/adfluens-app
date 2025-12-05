import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth.provider";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute component
 * Guards routes that require authentication
 * - Shows loading spinner while checking session
 * - Redirects to sign-in if not authenticated
 * - Renders child routes via Outlet when authenticated
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
