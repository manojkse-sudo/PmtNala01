"use client";
import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, EmptyState, Skeleton } from "@/components/ui/Card";
import { Badge } from "@/components/ui/FormControls";
import { usePatients, useDeletePatient } from "@/hooks/usePatients";
import { formatDate, calculateAge, getInitials } from "@/lib/utils";
import {
  Plus, Search, Users, Phone, Calendar,
  ChevronRight, Trash2, Edit
} from "lucide-react";
import type { Patient } from "@/types";

function PatientRow({ patient, onDelete }: { patient: Patient; onDelete: (id: string) => void }) {
  const age = patient.date_of_birth ? calculateAge(patient.date_of_birth) : null;

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors group border-b border-border last:border-0">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
        {getInitials(patient.full_name)}
      </div>

      {/* Name + number */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{patient.full_name}</p>
          {patient.patient_number && (
            <span className="text-[11px] text-gray-400 font-mono">{patient.patient_number}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {age !== null && (
            <span className="text-xs text-gray-500">{age} yrs, {patient.gender ?? "—"}</span>
          )}
          {patient.phone && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Phone className="h-3 w-3" />{patient.phone}
            </span>
          )}
        </div>
      </div>

      {/* Blood group */}
      {patient.blood_group && patient.blood_group !== "Unknown" && (
        <Badge variant="purple" className="hidden sm:inline-flex">{patient.blood_group}</Badge>
      )}

      {/* Date */}
      <span className="text-xs text-gray-400 hidden md:block w-24 text-right">
        {formatDate(patient.created_at)}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/patients/${patient.id}/edit`}>
          <Button variant="ghost" size="icon-sm">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hover:text-red-500"
          onClick={() => onDelete(patient.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <Link href={`/patients/${patient.id}`}>
          <Button variant="ghost" size="icon-sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { data, isLoading } = usePatients({ search: debouncedSearch || undefined, limit: 100 });
  const deletePatient = useDeletePatient();

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((window as any).__patientSearch);
    (window as any).__patientSearch = setTimeout(() => setDebouncedSearch(v), 300);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Patients"
        subtitle={data ? `${data.total} total` : undefined}
        actions={
          <Link href="/patients/new">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5" /> Add Patient
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <Card padding="none">
          {/* Search bar */}
          <div className="px-5 py-3 border-b border-border">
            <Input
              placeholder="Search by name, phone, or patient ID…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5" />}
              className="max-w-sm"
            />
          </div>

          {/* List */}
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !data?.items.length ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title={search ? "No patients found" : "No patients yet"}
              description={search ? "Try a different search term." : "Add your first patient to get started."}
              action={
                !search ? (
                  <Link href="/patients/new">
                    <Button size="sm"><Plus className="h-3.5 w-3.5" /> Add Patient</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <div>
              {data.items.map((p) => (
                <PatientRow
                  key={p.id}
                  patient={p}
                  onDelete={(id) => deletePatient.mutate(id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
