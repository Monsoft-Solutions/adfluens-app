import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { signUp, signIn } from "@repo/auth/client";
import { useAuth } from "@/lib/auth.provider";
import { AuthForm, type AuthFormData } from "../components/auth-form.component";

/**
 * Sign Up view component
 * Handles new user registration with email/password and social OAuth
 */
export const SignUpView: React.FC = () => {
  const navigate = useNavigate();
  const { refetchSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name || "",
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
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

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign up with Google"
      );
      setIsLoading(false);
    }
  };

  const handleFacebookSignUp = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "facebook",
        callbackURL: "/",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign up with Facebook"
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
            Start Analyzing Today
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of creators using AI-powered insights to understand
            what makes content go viral.
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl font-display font-semibold text-primary">
                AI
              </div>
              <div className="text-xs text-muted-foreground">
                Powered Analysis
              </div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl font-display font-semibold text-primary">
                Real
              </div>
              <div className="text-xs text-muted-foreground">Time Insights</div>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="text-2xl font-display font-semibold text-primary">
                Free
              </div>
              <div className="text-xs text-muted-foreground">
                To Get Started
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-reveal">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20">
              <Play className="w-6 h-6 text-primary fill-primary" />
            </div>
          </div>

          <AuthForm
            mode="sign-up"
            onSubmit={handleSubmit}
            onGoogleClick={handleGoogleSignUp}
            onFacebookClick={handleFacebookSignUp}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};
