import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar.component";
import { cn } from "@repo/ui";

/**
 * Main application layout with sidebar navigation
 * Uses Outlet to render child routes
 */
export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className={cn("flex-1 min-h-screen overflow-auto", "px-8 py-8")}>
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
