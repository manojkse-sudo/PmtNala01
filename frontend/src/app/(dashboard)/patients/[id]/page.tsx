"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/Card";
import { Badge } from "@/components/ui/FormControls";
import { usePatient } from "@/hooks/usePatients";
import { usePatientRecords } from "@/hooks/useRecords";
import { useAppointments } from "@/hooks/useAppointments";
import {
  formatDate, formatDateTime, calculateAge, getStatusColor, humanizeStatus
} from "@/lib/utils";
import {
  ArrowLeft, Edit, Phone, Mail, MapPin, Heart, Pill,
  AlertTriangle, Calendar, FileText, Activity, Plus
} from "lucide-react";

const TABS = ["Overview", "Records", "Appointments", "Vitals"] as const;
type Tab = typeof TABS[number];

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2 border-b border-border last:border-0">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const { data: patient, isLoading } = usePatient(id);
  const { data: records } = usePatientRecords(id);
  const { data: appts } = useAppointments({ patient_id: id });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <Card>
          <EmptyState icon={<FileText className="h-6 w-6" />} title="Patient not found" />
        </Card>
      </div>
    );
  }

  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={patient.full_name}
        subtitle={patient.patient_number ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/patients">
              <Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
            </Link>
            <Link href={`/patients/${id}/edit`}>
              <Button variant="outline" size="sm"><Edit className="h-3.5 w-3.5" /> Edit</Button>
            </Link>
            <Link href={`/appointments/new?patient=${id}`}>
              <Button size="sm"><Plus className="h-3.5 w-3.5" /> Book Appointment</Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Header card */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center text-base font-bold text-primary">
              {patient.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-gray-900">{patient.full_name}</h2>
                {patient.blood_group && patient.blood_group !== "Unknown" && (
                  <Badge variant="purple">{patient.blood_group}</Badge>
                )}
                {patient.gender && <Badge>{patient.gender}</Badge>}
              </div>
              <div className="flex items-center gap-4 mt-1 flex-wrap">
                {age !== null && <span className="text-sm text-gray-500">{age} years old</span>}
                {patient.phone && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="h-3.5 w-3.5" />{patient.phone}
                  </span>
                )}
                {patient.email && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />{patient.email}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Added {formatDate(patient.created_at)}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Details</h3>
              <InfoRow label="Date of Birth" value={patient.date_of_birth ? formatDate(patient.date_of_birth) : null} />
              <InfoRow label="Gender" value={patient.gender} />
              <InfoRow label="Blood Group" value={patient.blood_group} />
              <InfoRow label="City" value={patient.city} />
              <InfoRow label="State" value={patient.state} />
              <InfoRow label="Emergency Contact" value={
                patient.emergency_contact_name
                  ? `${patient.emergency_contact_name} — ${patient.emergency_contact_phone ?? ""}`
                  : null
              } />
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-400" /> Medical Background
              </h3>
              {patient.allergies && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3" /> Allergies
                  </p>
                  <p className="text-sm text-gray-700">{patient.allergies}</p>
                </div>
              )}
              {patient.chronic_conditions && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Chronic Conditions</p>
                  <p className="text-sm text-gray-700">{patient.chronic_conditions}</p>
                </div>
              )}
              {patient.current_medications && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                    <Pill className="h-3 w-3" /> Current Medications
                  </p>
                  <p className="text-sm text-gray-700">{patient.current_medications}</p>
                </div>
              )}
              {!patient.allergies && !patient.chronic_conditions && !patient.current_medications && (
                <p className="text-sm text-gray-400">No medical background on record.</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === "Records" && (
          <Card padding="none">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Medical Records</h3>
              <Link href={`/records/new?patient=${id}`}>
                <Button size="sm"><Plus className="h-3.5 w-3.5" /> New Record</Button>
              </Link>
            </div>
            {!records?.items.length ? (
              <EmptyState icon={<FileText className="h-6 w-6" />} title="No records yet" />
            ) : (
              records.items.map((r) => (
                <Link key={r.id} href={`/records/${r.id}`}>
                  <div className="flex items-start gap-4 px-5 py-4 hover:bg-muted transition-colors border-b border-border last:border-0 cursor-pointer">
                    <div className="mt-0.5 h-7 w-7 rounded-lg bg-secondary-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-3.5 w-3.5 text-secondary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {r.assessment ?? "Visit Record"}
                      </p>
                      {r.subjective && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{r.subjective}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(r.created_at)}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </Card>
        )}

        {activeTab === "Appointments" && (
          <Card padding="none">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Appointments</h3>
              <Link href={`/appointments/new?patient=${id}`}>
                <Button size="sm"><Plus className="h-3.5 w-3.5" /> Book</Button>
              </Link>
            </div>
            {!appts?.items.length ? (
              <EmptyState icon={<Calendar className="h-6 w-6" />} title="No appointments" />
            ) : (
              appts.items.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{formatDateTime(a.scheduled_at)}</p>
                    <p className="text-xs text-gray-500">{a.chief_complaint ?? a.appointment_type}</p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${getStatusColor(a.status)}`}>
                    {humanizeStatus(a.status)}
                  </span>
                </div>
              ))
            )}
          </Card>
        )}

        {activeTab === "Vitals" && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Activity className="h-4 w-4 text-secondary-600" /> Vitals History
              </h3>
              <Link href={`/records/new?patient=${id}&vitals=1`}>
                <Button size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /> Record Vitals</Button>
              </Link>
            </div>
            <p className="text-sm text-gray-400">Vitals chart will appear here once recorded.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
