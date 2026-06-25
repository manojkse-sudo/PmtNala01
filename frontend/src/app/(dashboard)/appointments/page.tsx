"use client";
import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/Card";
import { Select } from "@/components/ui/FormControls";
import {
  useAppointments, useAppointmentStats, useUpdateAppointment
} from "@/hooks/useAppointments";
import { formatDateTime, formatTime, getStatusColor, humanizeStatus, getInitials } from "@/lib/utils";
import { Plus, Calendar, ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { AppointmentStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useAppointments({
    status: statusFilter || undefined,
    limit: 100,
  });
  const { data: stats } = useAppointmentStats();
  const updateAppt = useUpdateAppointment();

  const markComplete = (id: string) =>
    updateAppt.mutate({ id, data: { status: "completed" as AppointmentStatus } });
  const markCancelled = (id: string) =>
    updateAppt.mutate({ id, data: { status: "cancelled" as AppointmentStatus } });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Appointments"
        subtitle={data ? `${data.total} total` : undefined}
        actions={
          <Link href="/appointments/new">
            <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Appointment</Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Mini stats */}
        {stats && (
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "Scheduled", value: stats.scheduled, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Completed", value: stats.completed, color: "text-green-600", bg: "bg-green-50" },
              { label: "Cancelled", value: stats.cancelled, color: "text-red-500", bg: "bg-red-50" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg}`}>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
                <span className={`text-xs ${color}`}>{label}</span>
              </div>
            ))}
          </div>
        )}

        <Card padding="none">
          {/* Filters */}
          <div className="px-5 py-3 border-b border-border flex items-center gap-3">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
          </div>

          {/* List */}
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !data?.items.length ? (
            <EmptyState
              icon={<Calendar className="h-6 w-6" />}
              title="No appointments"
              description="No appointments match your current filter."
              action={
                <Link href="/appointments/new">
                  <Button size="sm"><Plus className="h-3.5 w-3.5" /> Book One</Button>
                </Link>
              }
            />
          ) : (
            <div>
              {data.items.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors border-b border-border last:border-0 group"
                >
                  {/* Time */}
                  <div className="text-center w-16 flex-shrink-0">
                    <p className="text-xs font-bold text-primary">{formatTime(appt.scheduled_at)}</p>
                    <p className="text-[11px] text-gray-400">{appt.duration_minutes}m</p>
                  </div>

                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-accent-50 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {appt.patient ? getInitials(appt.patient.full_name) : "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {appt.patient?.full_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {appt.chief_complaint || humanizeStatus(appt.appointment_type)} ·{" "}
                      {formatDateTime(appt.scheduled_at)}
                    </p>
                  </div>

                  {/* Status */}
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-medium flex-shrink-0 ${getStatusColor(appt.status)}`}>
                    {humanizeStatus(appt.status)}
                  </span>

                  {/* Quick actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {appt.status === "scheduled" || appt.status === "confirmed" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:text-green-600"
                          onClick={() => markComplete(appt.id)}
                          title="Mark complete"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="hover:text-red-500"
                          onClick={() => markCancelled(appt.id)}
                          title="Cancel"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : null}
                    <Link href={`/appointments/${appt.id}`}>
                      <Button variant="ghost" size="icon-sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
