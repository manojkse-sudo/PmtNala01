"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard, Card, CardHeader, CardTitle, Skeleton } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Users, Calendar, CheckCircle2, Clock, Plus, ArrowRight,
  FilePlus, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { formatTime, getStatusColor, humanizeStatus, getInitials } from "@/lib/utils";
import { useTodayAppointments } from "@/hooks/useAppointments";
import { useSettingsStore } from "@/store/settings";
import Link from "next/link";
import type { TrendPoint } from "@/types";

// ── Mini bar chart (pure CSS, no library) ─────────────────────────────────────
function TrendChart({ data, label }: { data: TrendPoint[]; label: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const last7 = data.slice(-7);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-end gap-1 h-20">
        {last7.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isToday = i === last7.length - 1;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className={`w-full rounded-t transition-all ${isToday ? "bg-primary" : "bg-primary-200 group-hover:bg-primary-300"}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                {d.count} case{d.count !== 1 ? "s" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {last7.map((d, i) => (
          <p key={d.date} className={`text-[10px] flex-1 text-center ${i === last7.length - 1 ? "text-primary font-bold" : "text-gray-400"}`}>
            {new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2)}
          </p>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { doctor } = useAuthStore();
  const { modules } = useSettingsStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
    staleTime: 60_000,
  });

  const { data: trends } = useQuery({
    queryKey: ["dashboard-trends"],
    queryFn: dashboardApi.trends,
    staleTime: 300_000,
  });

  const { data: todayAppts, isLoading: loadingToday } = useTodayAppointments();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Dashboard"
        subtitle={`${greeting()}, ${doctor?.first_name}`}
        actions={
          <Link href="/cases/new">
            <Button size="sm">
              <FilePlus className="h-3.5 w-3.5" />
              New Case
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Total Patients"
            value={stats?.total_patients ?? 0}
            icon={<Users className="h-5 w-5 text-primary" />}
            iconBg="bg-primary-50"
          />
          <StatCard
            label="Today's Cases"
            value={stats?.today_cases ?? 0}
            icon={<FilePlus className="h-5 w-5 text-secondary-600" />}
            iconBg="bg-secondary-50"
          />
          <StatCard
            label="Completed"
            value={stats?.completed_appointments ?? 0}
            icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
            iconBg="bg-green-50"
          />
          <StatCard
            label="Scheduled"
            value={stats?.scheduled_appointments ?? 0}
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            iconBg="bg-amber-50"
          />
        </div>

        {/* Trends + Quick actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Trend chart */}
          <Card className="xl:col-span-2">
            <CardHeader className="mb-4">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Patient Activity
              </CardTitle>
            </CardHeader>

            {trends ? (
              <div className="space-y-5">
                {/* Summary pills */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-primary-50 p-3 text-center">
                    <p className="text-xl font-bold text-primary">{trends.today_total}</p>
                    <p className="text-[11px] text-primary-600 mt-0.5">Today</p>
                  </div>
                  <div className="rounded-xl bg-secondary-50 p-3 text-center">
                    <p className="text-xl font-bold text-secondary-700">{trends.weekly_total}</p>
                    <p className="text-[11px] text-secondary-600 mt-0.5">This Week</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 p-3 text-center">
                    <p className="text-xl font-bold text-accent-700">{trends.monthly_total}</p>
                    <p className="text-[11px] text-accent-600 mt-0.5">This Month</p>
                  </div>
                </div>

                {/* 7-day bar chart */}
                <TrendChart data={trends.daily} label="Cases — last 7 days (today highlighted)" />

                {/* 30-day sparkline */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">30-day trend</p>
                  <div className="flex items-end gap-px h-8">
                    {trends.daily.map((d, i) => {
                      const max = Math.max(...trends.daily.map((x) => x.count), 1);
                      const pct = (d.count / max) * 100;
                      const isToday = i === trends.daily.length - 1;
                      return (
                        <div
                          key={d.date}
                          className={`flex-1 rounded-sm ${isToday ? "bg-primary" : "bg-primary-100"}`}
                          style={{ height: `${Math.max(pct, 8)}%` }}
                          title={`${d.date}: ${d.count}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                Loading trends...
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <div className="space-y-2">
              {[
                { label: "Create Case", href: "/cases/new", icon: FilePlus, color: "text-primary" },
                { label: "Add New Patient", href: "/patients/new", icon: Users, color: "text-secondary-600" },
                ...(modules.module_appointments !== false
                  ? [{ label: "Book Appointment", href: "/appointments/new", icon: Calendar, color: "text-amber-600" }]
                  : []),
              ].map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer group">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-white transition-colors">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>

        {/* Today's schedule (only when appointments module is enabled) */}
        {modules.module_appointments !== false && (
          <Card padding="none">
            <CardHeader className="px-5 pt-4 pb-0 mb-0">
              <CardTitle>Today&apos;s Schedule</CardTitle>
              <Link href="/appointments" className="flex items-center gap-1 text-xs text-secondary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>

            <div className="divide-y divide-border">
              {loadingToday ? (
                <div className="p-5 space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
                </div>
              ) : !todayAppts?.length ? (
                <div className="py-10 text-center">
                  <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No appointments today</p>
                  <Link href="/appointments/new">
                    <Button variant="ghost" size="sm" className="mt-2">
                      <Plus className="h-3.5 w-3.5" /> Schedule one
                    </Button>
                  </Link>
                </div>
              ) : (
                todayAppts.map((appt) => (
                  <Link key={appt.id} href={`/appointments/${appt.id}`}>
                    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted transition-colors cursor-pointer">
                      <div className="text-center w-14 flex-shrink-0">
                        <p className="text-xs font-bold text-primary">{formatTime(appt.scheduled_at)}</p>
                        <p className="text-[11px] text-gray-400">{appt.duration_minutes}m</p>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-accent-50 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {appt.patient ? getInitials(appt.patient.full_name) : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appt.patient?.full_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{appt.chief_complaint || appt.appointment_type}</p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getStatusColor(appt.status)}`}>
                        {humanizeStatus(appt.status)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
