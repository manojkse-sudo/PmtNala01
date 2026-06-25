"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/FormControls";
import { Card } from "@/components/ui/Card";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { usePatients } from "@/hooks/usePatients";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const schema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  scheduled_at: z.string().min(1, "Date and time are required"),
  duration_minutes: z.number().min(5).max(480),
  appointment_type: z.enum(["consultation","follow_up","emergency","procedure","teleconsult"]),
  chief_complaint: z.string().optional(),
  notes: z.string().optional(),
  fee: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

const TYPE_OPTIONS = [
  { value: "consultation", label: "Consultation" },
  { value: "follow_up", label: "Follow-up" },
  { value: "emergency", label: "Emergency" },
  { value: "procedure", label: "Procedure" },
  { value: "teleconsult", label: "Teleconsult" },
];

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPatient = searchParams.get("patient") ?? "";
  const createAppointment = useCreateAppointment();
  const { data: patientsData } = usePatients({ limit: 200 });

  const patientOptions = (patientsData?.items ?? []).map((p) => ({
    value: p.id,
    label: `${p.full_name}${p.patient_number ? ` (${p.patient_number})` : ""}`,
  }));

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: defaultPatient,
      duration_minutes: 30,
      appointment_type: "consultation",
    },
  });

  const onSubmit = async (data: FormData) => {
    // Convert local datetime to ISO
    const isoDate = new Date(data.scheduled_at).toISOString();
    await createAppointment.mutateAsync({
      ...data,
      scheduled_at: isoDate,
      fee: data.fee ? data.fee * 100 : undefined, // convert to paise
    });
    router.push("/appointments");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Book Appointment"
        actions={
          <Link href="/appointments">
            <Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto space-y-4">
          <Card>
            <div className="space-y-4">
              <Select
                label="Patient"
                required
                options={patientOptions}
                placeholder="Select patient…"
                {...register("patient_id")}
                error={errors.patient_id?.message}
              />
              <Input
                label="Date & Time"
                type="datetime-local"
                required
                {...register("scheduled_at")}
                error={errors.scheduled_at?.message}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Type"
                  options={TYPE_OPTIONS}
                  {...register("appointment_type")}
                />
                <Select
                  label="Duration"
                  options={DURATION_OPTIONS}
                  {...register("duration_minutes", { valueAsNumber: true })}
                />
              </div>
              <Input
                label="Consultation Fee (₹)"
                type="number"
                placeholder="500"
                {...register("fee", { valueAsNumber: true })}
              />
              <Textarea
                label="Chief Complaint"
                placeholder="What brings the patient in today?"
                rows={2}
                {...register("chief_complaint")}
              />
              <Textarea
                label="Notes"
                placeholder="Any preparation notes or instructions…"
                rows={2}
                {...register("notes")}
              />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pb-6">
            <Link href="/appointments">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={createAppointment.isPending}>
              Book Appointment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense>
      <NewAppointmentForm />
    </Suspense>
  );
}
