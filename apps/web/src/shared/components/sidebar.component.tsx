import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Youtube,
  Search,
  LayoutDashboard,
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import { Button, cn, Skeleton } from "@repo/ui";
import { useSession, signOut } from "@/lib/auth.client";

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
          <div className="bg-primary text-primary-foreground p-2.5 rounded-xl shadow-sm">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">
              YouTube
            </h1>
            <p className="text-xs text-muted-foreground">Analyzer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
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
            </div>
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

      {/* Footer */}
      <div className="px-4 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} YouTube Analyzer
        </p>
      </div>
    </aside>
  );
};
