import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { signIn } from "@repo/auth/client";
import { useAuth } from "@/lib/auth.provider";
import { AuthForm, type AuthFormData } from "../components/auth-form.component";

/**
 * Sign In view component
 * Handles user authentication with email/password and social OAuth
 */
export const SignInView: React.FC = () => {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to sign in");
        return;
      }

      // Refetch session to update auth state before navigating
      await refetchSession();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google"
      );
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "facebook",
        callbackURL: "/",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Facebook"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding with noise texture */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-background to-background items-center justify-center p-12 noise-texture">
        <div className="max-w-md text-center relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-primary/10 mb-8 border border-primary/20">
            <Play className="w-10 h-10 text-primary fill-primary" />
          </div>
          <h2 className="text-3xl font-display font-semibold text-foreground mb-4 tracking-tight">
            YouTube Channel Analyzer
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover viral content patterns, analyze engagement metrics, and get
            AI-powered insights to grow your YouTube channel.
          </p>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-reveal">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
              <Play className="w-6 h-6 text-primary fill-primary" />
            </div>
          </div>

          <AuthForm
            mode="sign-in"
            onSubmit={handleSubmit}
            onGoogleClick={handleGoogleSignIn}
            onFacebookClick={handleFacebookSignIn}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};
