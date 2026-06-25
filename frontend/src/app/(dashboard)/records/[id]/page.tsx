"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/Card";
import { Badge } from "@/components/ui/FormControls";
import { useRecord } from "@/hooks/useRecords";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, FileText, Pill, FlaskConical, Calendar } from "lucide-react";

function SOAPSection({ label, content, color }: { label: string; content?: string | null; color: string }) {
  if (!content) return null;
  return (
    <div className="pb-4 border-b border-border last:border-0 last:pb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center h-5 w-5 rounded text-xs font-bold text-white ${color}`}>
          {label[0]}
        </span>
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: record, isLoading } = useRecord(id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6">
        <Card>
          <EmptyState icon={<FileText className="h-6 w-6" />} title="Record not found" />
        </Card>
      </div>
    );
  }

  const hasSoap = record.subjective || record.objective || record.assessment || record.plan;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Medical Record"
        subtitle={formatDateTime(record.created_at)}
        actions={
          <Link href={`/patients/${record.patient_id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Patient
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-2xl">
        {/* SOAP Notes */}
        <Card>
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Clinical Notes
          </h3>
          {hasSoap ? (
            <div className="space-y-4">
              <SOAPSection label="Subjective" content={record.subjective} color="bg-blue-500" />
              <SOAPSection label="Objective" content={record.objective} color="bg-secondary" />
              <SOAPSection label="Assessment" content={record.assessment} color="bg-primary" />
              <SOAPSection label="Plan" content={record.plan} color="bg-green-500" />
            </div>
          ) : (
            <p className="text-sm text-gray-400">No SOAP notes recorded.</p>
          )}
          {record.follow_up_days && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-sm text-secondary-600">
              <Calendar className="h-4 w-4" />
              Follow up in <strong>{record.follow_up_days} days</strong>
            </div>
          )}
        </Card>

        {/* Prescriptions */}
        {record.prescriptions && record.prescriptions.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Pill className="h-4 w-4 text-accent-500" /> Prescriptions
            </h3>
            <div className="space-y-3">
              {(record.prescriptions as any[]).map((rx, i) => (
                <div key={i} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900">{rx.drug}</p>
                    <span className="text-xs bg-primary-50 text-primary px-2 py-0.5 rounded font-mono">{rx.dose}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {rx.frequency} · {rx.duration}
                    {rx.instructions ? ` · ${rx.instructions}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Lab Orders */}
        {record.lab_orders && record.lab_orders.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-secondary-600" /> Lab Orders
            </h3>
            <div className="space-y-2">
              {(record.lab_orders as any[]).map((lab, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                  <span className="text-xs font-medium text-gray-900">{lab.test}</span>
                  {lab.notes && <span className="text-xs text-gray-500">— {lab.notes}</span>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Diagnosis Codes */}
        {record.diagnosis_codes && record.diagnosis_codes.length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">ICD-10 Codes</h3>
            <div className="flex flex-wrap gap-2">
              {(record.diagnosis_codes as any[]).map((dx, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-muted rounded-lg px-3 py-1.5">
                  <span className="text-xs font-mono font-bold text-primary">{dx.code}</span>
                  <span className="text-xs text-gray-600">{dx.description}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
