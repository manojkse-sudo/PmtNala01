"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard, Card, CardHeader, CardTitle, Skeleton } from "@/components/ui/Card";
import { Badge } from "@/components/ui/FormControls";
import { Button } from "@/components/ui/Button";
import {
  Users, Calendar, CheckCircle2, Clock, Plus, ArrowRight,
  TrendingUp, XCircle
} from "lucide-react";
import { useTodayAppointments } from "@/hooks/useAppointments";
import { useAuthStore } from "@/store/auth";
import { formatTime, getStatusColor, humanizeStatus, getInitials } from "@/lib/utils";
import Link from "next/link";

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
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
    staleTime: 60_000,
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
          <Link href="/appointments/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Appointment
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Patients"
            value={stats?.total_patients ?? 0}
            icon={<Users className="h-5 w-5 text-primary" />}
            iconBg="bg-primary-50"
          />
          <StatCard
            label="Today's Appointments"
            value={stats?.today_appointments ?? 0}
            icon={<Calendar className="h-5 w-5 text-secondary-600" />}
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

        {/* Today's schedule */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2" padding="none">
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
                <div className="py-12 text-center">
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

          {/* Quick actions */}
          <Card>
            <CardTitle className="mb-4">Quick Actions</CardTitle>
            <div className="space-y-2">
              {[
                { label: "Add New Patient", href: "/patients/new", icon: Users, color: "text-primary" },
                { label: "Book Appointment", href: "/appointments/new", icon: Calendar, color: "text-secondary-600" },
                { label: "Write Prescription", href: "/records/new", icon: CheckCircle2, color: "text-green-600" },
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
      </div>
    </div>
  );
}
