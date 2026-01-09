import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Youtube,
  Search,
  LayoutDashboard,
  Settings,
  LogOut,
  LogIn,
  User,
  ChevronDown,
  Building2,
  Instagram,
  Facebook,
} from "lucide-react";

/**
 * TikTok icon component (not available in lucide-react)
 */
const TiktokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);
import { Button, cn, Skeleton, Separator, ThemeToggleIcon } from "@repo/ui";
import { useSession, signOut } from "@repo/auth/client";
import { useTheme } from "@/lib/theme.provider";

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
};

/**
 * Navigation item component with active state styling
 */
const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        isActive && "bg-primary/10 text-primary font-medium"
      )
    }
  >
    {icon}
    <span className="text-sm">{label}</span>
  </NavLink>
);

/**
 * Sidebar navigation component
 * Provides navigation between main areas of the application
 */
export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const { theme, setTheme } = useTheme();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  return (
    <aside
      className={cn(
        "w-64 h-screen sticky top-0",
        "bg-card border-r border-border",
        "flex flex-col"
      )}
    >
      {/* Logo / Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2.5 rounded-lg">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-display font-semibold text-foreground tracking-tight">
              YouTube
            </h1>
            <p className="text-xs text-muted-foreground">Analyzer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem
          to="/"
          icon={<LayoutDashboard className="w-5 h-5" />}
          label="Channel Analyzer"
        />
        <NavItem
          to="/search"
          icon={<Search className="w-5 h-5" />}
          label="Video Search"
        />
        <NavItem
          to="/settings"
          icon={<Settings className="w-5 h-5" />}
          label="Settings"
        />

        {/* Social Media Section */}
        <div className="pt-4">
          <p className="px-4 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Social Media
          </p>
          <NavItem
            to="/social/instagram"
            icon={<Instagram className="w-5 h-5" />}
            label="Instagram"
          />
          <NavItem
            to="/social/facebook"
            icon={<Facebook className="w-5 h-5" />}
            label="Facebook"
          />
          <NavItem
            to="/social/tiktok"
            icon={<TiktokIcon className="w-5 h-5" />}
            label="TikTok"
          />
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        {isPending ? (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ) : session?.user ? (
          <div className="space-y-2">
            {/* User Info Button (toggles dropdown) */}
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors",
                "hover:bg-accent text-left"
              )}
            >
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  isUserMenuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="space-y-1 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    navigate("/settings");
                    setIsUserMenuOpen(false);
                  }}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Organization Settings
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/sign-in")}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in
          </Button>
        )}
      </div>

      {/* Theme Toggle */}
      <div className="px-4 pb-2">
        <Separator className="mb-3" />
        <ThemeToggleIcon theme={theme} onThemeChange={setTheme} />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} YouTube Analyzer
        </p>
      </div>
    </aside>
  );
};
