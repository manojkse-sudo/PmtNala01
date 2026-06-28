"use client";
import { ReactNode } from "react";
import { Bell, Menu } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { doctor } = useAuthStore();
  const { toggleMobileSidebar } = useUIStore();

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-border flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-muted hover:text-gray-700 transition-colors flex-shrink-0"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-muted hover:text-gray-700 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
