import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button, Input, Label, cn } from "@repo/ui";
import { SocialButtons } from "./social-buttons.component";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
  onSubmit: (data: AuthFormData) => Promise<void>;
  onGoogleClick: () => void;
  onFacebookClick: () => void;
  isLoading?: boolean;
  error?: string | null;
};

export type AuthFormData = {
  email: string;
  password: string;
  name?: string;
};

/**
 * Reusable authentication form component
 * Supports both sign-in and sign-up modes with social OAuth
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  onGoogleClick,
  onFacebookClick,
  isLoading = false,
  error = null,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === "sign-up";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      email,
      password,
      ...(isSignUp && { name }),
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground">
          {isSignUp
            ? "Start analyzing YouTube channels today"
            : "Sign in to continue to your dashboard"}
        </p>
      </div>

      {/* Social OAuth Buttons */}
      <SocialButtons
        onGoogleClick={onGoogleClick}
        onFacebookClick={onFacebookClick}
        isLoading={isLoading}
        disabled={isLoading}
      />

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className={cn(
            "bg-destructive/10 border border-destructive/20 text-destructive",
            "px-4 py-3 rounded-lg mb-6 flex items-center gap-3"
          )}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="name"
              className="h-11"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
            autoComplete="email"
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={
                isSignUp ? "Min. 8 characters" : "Enter your password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2",
                "text-muted-foreground hover:text-foreground",
                "transition-colors"
              )}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-11" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {isSignUp ? "Creating account..." : "Signing in..."}
            </>
          ) : (
            <>{isSignUp ? "Create account" : "Sign in"}</>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              to="/sign-up"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
};
