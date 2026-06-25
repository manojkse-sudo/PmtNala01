"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/Card";
import { Badge } from "@/components/ui/FormControls";
import { useAppointment, useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import {
  formatDateTime, formatDate, calculateAge, getStatusColor,
  humanizeStatus, getAppointmentTypeLabel, formatCurrency
} from "@/lib/utils";
import {
  ArrowLeft, User, Clock, Calendar, FileText,
  CheckCircle2, XCircle, Play, Plus, Trash2
} from "lucide-react";
import type { AppointmentStatus } from "@/types";

const STATUS_TRANSITIONS: Record<string, { label: string; status: AppointmentStatus; icon: React.ReactNode; variant: "primary" | "outline" | "destructive" }[]> = {
  scheduled: [
    { label: "Confirm", status: "confirmed", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "primary" },
    { label: "Cancel", status: "cancelled", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
  ],
  confirmed: [
    { label: "Start Visit", status: "in_progress", icon: <Play className="h-3.5 w-3.5" />, variant: "primary" },
    { label: "Cancel", status: "cancelled", icon: <XCircle className="h-3.5 w-3.5" />, variant: "destructive" },
  ],
  in_progress: [
    { label: "Complete", status: "completed", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "primary" },
  ],
  completed: [],
  cancelled: [],
  no_show: [],
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-gray-500 w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: appt, isLoading } = useAppointment(id);
  const updateAppt = useUpdateAppointment();
  const deleteAppt = useDeleteAppointment();

  const handleStatusChange = (status: AppointmentStatus) => {
    updateAppt.mutate({ id, data: { status } });
  };

  const handleDelete = async () => {
    if (confirm("Cancel and delete this appointment?")) {
      await deleteAppt.mutateAsync(id);
      router.push("/appointments");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="p-6">
        <Card>
          <EmptyState icon={<Calendar className="h-6 w-6" />} title="Appointment not found" />
        </Card>
      </div>
    );
  }

  const transitions = STATUS_TRANSITIONS[appt.status] ?? [];
  const patient = appt.patient;
  const age = patient?.date_of_birth ? calculateAge(patient.date_of_birth) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Appointment"
        subtitle={formatDateTime(appt.scheduled_at)}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/appointments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
            {transitions.map(({ label, status, icon, variant }) => (
              <Button
                key={status}
                variant={variant}
                size="sm"
                loading={updateAppt.isPending}
                onClick={() => handleStatusChange(status)}
              >
                {icon}{label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon-sm"
              className="hover:text-red-500"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Status header */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-gray-900">
                    {formatDateTime(appt.scheduled_at)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getStatusColor(appt.status)}`}>
                    {humanizeStatus(appt.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {appt.duration_minutes} min · {getAppointmentTypeLabel(appt.appointment_type)}
                  {appt.fee ? ` · ${formatCurrency(appt.fee)}` : ""}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Patient info */}
          {patient && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Patient
                </h3>
                <Link href={`/patients/${patient.id}`}>
                  <Button variant="ghost" size="xs">View profile →</Button>
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-sm font-bold text-primary">
                  {patient.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{patient.full_name}</p>
                  <p className="text-xs text-gray-500">
                    {age !== null ? `${age} yrs` : ""}{patient.gender ? `, ${patient.gender}` : ""}
                    {patient.patient_number ? ` · ${patient.patient_number}` : ""}
                  </p>
                </div>
              </div>
              {patient.phone && <DetailRow label="Phone" value={patient.phone} />}
              {patient.allergies && (
                <div className="mt-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs font-medium text-amber-700">⚠ Allergies: {patient.allergies}</p>
                </div>
              )}
            </Card>
          )}

          {/* Appointment notes */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Details</h3>
            <DetailRow label="Chief Complaint" value={appt.chief_complaint} />
            <DetailRow label="Notes" value={appt.notes} />
            <DetailRow label="Created" value={formatDateTime(appt.created_at)} />
            {!appt.chief_complaint && !appt.notes && (
              <p className="text-sm text-gray-400">No additional details recorded.</p>
            )}
          </Card>
        </div>

        {/* Action: Create record from this appointment */}
        {appt.status === "completed" && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Medical Record</p>
                <p className="text-xs text-gray-500">Document the visit with SOAP notes and prescriptions</p>
              </div>
              <Link href={`/records/new?patient=${patient?.id}&appointment=${id}`}>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> Write Record
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
