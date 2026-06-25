"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, FileText,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Stethoscope
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { useRouter } from "next/navigation";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Appointments", href: "/appointments", icon: Calendar },
  { label: "Records", href: "/records", icon: FileText },
];

const BOTTOM_NAV = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { doctor, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-primary border-r border-primary-600",
        "transition-all duration-250 ease-in-out flex-shrink-0",
        sidebarOpen ? "w-56" : "w-14"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center h-14 px-3 border-b border-primary-600 flex-shrink-0",
        sidebarOpen ? "justify-between" : "justify-center"
      )}>
        {sidebarOpen ? (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-bold text-base tracking-tight">NalaBase</span>
          </div>
        ) : (
          <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            "h-6 w-6 rounded flex items-center justify-center",
            "text-primary-300 hover:text-white hover:bg-primary-600 transition-colors",
            !sidebarOpen && "hidden"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Collapse toggle when closed */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="h-8 w-8 rounded mx-auto mt-2 flex items-center justify-center text-primary-300 hover:text-white hover:bg-primary-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium",
                "transition-colors duration-100",
                active
                  ? "bg-white/15 text-white"
                  : "text-primary-200 hover:bg-white/10 hover:text-white",
                !sidebarOpen && "justify-center px-0"
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-primary-600 space-y-0.5">
        {BOTTOM_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium",
              "text-primary-200 hover:bg-white/10 hover:text-white transition-colors",
              !sidebarOpen && "justify-center px-0"
            )}
            title={!sidebarOpen ? label : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </Link>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium",
            "text-primary-200 hover:bg-white/10 hover:text-red-300 transition-colors",
            !sidebarOpen && "justify-center px-0"
          )}
          title={!sidebarOpen ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>

        {/* Doctor Avatar */}
        {doctor && (
          <div className={cn(
            "flex items-center gap-2.5 px-2 pt-3 pb-1 border-t border-primary-600 mt-1",
            !sidebarOpen && "justify-center"
          )}>
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitials(doctor.full_name)}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{doctor.full_name}</p>
                <p className="text-[11px] text-primary-300 truncate">{doctor.specialty || "General"}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
