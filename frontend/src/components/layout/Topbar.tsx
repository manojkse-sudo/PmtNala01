"use client";
import { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { doctor } = useAuthStore();

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-border flex-shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-muted hover:text-gray-700 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
