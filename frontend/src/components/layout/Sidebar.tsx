"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, FileText,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Stethoscope, X, FilePlus, Package, ShieldCheck,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useUIStore } from "@/store/ui";
import { useSettingsStore } from "@/store/settings";
import { useRouter } from "next/navigation";

// Nav items visible to every authenticated doctor
const DOCTOR_NAV = [
  { label: "Dashboard",   href: "/dashboard",   icon: LayoutDashboard },
  { label: "Create Case", href: "/cases/new",   icon: FilePlus },
  { label: "Patients",    href: "/patients",    icon: Users },
];

// Optional items controlled by admin feature flags
const OPTIONAL_NAV: Array<{ label: string; href: string; icon: React.ElementType; moduleKey: string }> = [
  { label: "Appointments", href: "/appointments", icon: Calendar,  moduleKey: "module_appointments" },
  { label: "Inventory",    href: "/inventory",    icon: Package,   moduleKey: "module_inventory" },
];

// Admin-only nav
const ADMIN_NAV = [
  { label: "Admin Console", href: "/admin", icon: ShieldCheck },
];

const BOTTOM_NAV = [
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLink({
  href, label, icon: Icon, collapsed, onClick,
}: {
  href: string; label: string; icon: React.ElementType; collapsed: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium",
        "transition-colors duration-100",
        active
          ? "bg-white/15 text-white"
          : "text-primary-200 hover:bg-white/10 hover:text-white",
        collapsed && "justify-center px-0"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { doctor, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const { modules } = useSettingsStore();
  const router = useRouter();

  const isAdmin = doctor?.is_admin ?? false;

  const handleLogout = () => {
    logout();
    onClose?.();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center h-14 px-3 border-b border-primary-600 flex-shrink-0",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed ? (
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

        {!collapsed && !onClose && (
          <button
            onClick={toggleSidebar}
            className="h-6 w-6 rounded flex items-center justify-center text-primary-300 hover:text-white hover:bg-primary-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="h-6 w-6 rounded flex items-center justify-center text-primary-300 hover:text-white hover:bg-primary-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {collapsed && !onClose && (
        <button
          onClick={toggleSidebar}
          className="h-8 w-8 rounded mx-auto mt-2 flex items-center justify-center text-primary-300 hover:text-white hover:bg-primary-600 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {/* Core doctor nav */}
        {DOCTOR_NAV.map(({ label, href, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} onClick={onClose} />
        ))}

        {/* Optional module nav (admin-toggled) */}
        {OPTIONAL_NAV.filter(({ moduleKey }) => modules[moduleKey] !== false).map(({ label, href, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} onClick={onClose} />
        ))}

        {/* Admin-only section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-400 px-2.5 pt-3 pb-1">
                Admin
              </p>
            )}
            {collapsed && <div className="border-t border-primary-600 my-2" />}
            {ADMIN_NAV.map(({ label, href, icon }) => (
              <NavLink key={href} href={href} label={label} icon={icon} collapsed={collapsed} onClick={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-primary-600 space-y-0.5">
        {BOTTOM_NAV.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium",
              "text-primary-200 hover:bg-white/10 hover:text-white transition-colors",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 h-9 px-2.5 rounded-lg text-sm font-medium",
            "text-primary-200 hover:bg-white/10 hover:text-red-300 transition-colors",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {doctor && (
          <div className={cn(
            "flex items-center gap-2.5 px-2 pt-3 pb-1 border-t border-primary-600 mt-1",
            collapsed && "justify-center"
          )}>
            <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getInitials(doctor.full_name)}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{doctor.full_name}</p>
                <p className="text-[11px] text-primary-300 truncate">
                  {isAdmin ? "Admin" : (doctor.specialty || "General")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { sidebarOpen, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-primary border-r border-primary-600",
          "transition-all duration-250 ease-in-out flex-shrink-0",
          sidebarOpen ? "w-56" : "w-14"
        )}
      >
        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-primary lg:hidden",
          "transition-transform duration-300 ease-in-out",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent collapsed={false} onClose={() => setMobileSidebarOpen(false)} />
      </aside>
    </>
  );
}
