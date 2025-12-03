import React from "react";
import { NavLink } from "react-router-dom";
import { Youtube, Search, LayoutDashboard } from "lucide-react";
import { cn } from "@repo/ui";

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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} YouTube Analyzer
        </p>
      </div>
    </aside>
  );
};
