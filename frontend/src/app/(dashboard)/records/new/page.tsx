"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/FormControls";
import { Card } from "@/components/ui/Card";
import { useCreateRecord } from "@/hooks/useRecords";
import { usePatients } from "@/hooks/usePatients";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const rxSchema = z.object({
  drug: z.string().min(1),
  dose: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

const schema = z.object({
  patient_id: z.string().min(1, "Select a patient"),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  follow_up_days: z.number().optional(),
  prescriptions: z.array(rxSchema).optional(),
});

type FormData = z.infer<typeof schema>;

function NewRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPatient = searchParams.get("patient") ?? "";
  const createRecord = useCreateRecord();
  const { data: patientsData } = usePatients({ limit: 200 });

  const patientOptions = (patientsData?.items ?? []).map((p) => ({
    value: p.id,
    label: `${p.full_name}${p.patient_number ? ` (${p.patient_number})` : ""}`,
  }));

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: defaultPatient,
      prescriptions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "prescriptions" });

  const onSubmit = async (data: FormData) => {
    await createRecord.mutateAsync(data as any);
    router.push(defaultPatient ? `/patients/${defaultPatient}` : "/records");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="New Medical Record"
        actions={
          <Link href="/records">
            <Button variant="outline" size="sm"><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4">
          <Card>
            <Select
              label="Patient"
              required
              options={patientOptions}
              placeholder="Select patient…"
              {...register("patient_id")}
              error={errors.patient_id?.message}
            />
          </Card>

          {/* SOAP Notes */}
          <Card>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              SOAP Notes
            </h3>
            <div className="space-y-4">
              <Textarea
                label="Subjective (S)"
                placeholder="Chief complaint, history of presenting illness, review of systems…"
                rows={3}
                hint="What the patient reports"
                {...register("subjective")}
              />
              <Textarea
                label="Objective (O)"
                placeholder="Examination findings, vitals, investigations…"
                rows={3}
                hint="What you observe and measure"
                {...register("objective")}
              />
              <Textarea
                label="Assessment (A)"
                placeholder="Diagnosis, differential diagnoses…"
                rows={2}
                hint="Your clinical impression"
                {...register("assessment")}
              />
              <Textarea
                label="Plan (P)"
                placeholder="Treatment plan, investigations ordered, referrals…"
                rows={3}
                hint="What you plan to do"
                {...register("plan")}
              />
              <Input
                label="Follow-up in (days)"
                type="number"
                placeholder="7"
                {...register("follow_up_days", { valueAsNumber: true })}
                className="w-40"
              />
            </div>
          </Card>

          {/* Prescriptions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prescriptions</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ drug: "", dose: "", frequency: "", duration: "", instructions: "" })}
              >
                <Plus className="h-3.5 w-3.5" /> Add Drug
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-400">No medications added yet.</p>
            )}

            {fields.map((field, i) => (
              <div key={field.id} className="border border-border rounded-lg p-4 mb-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Drug #{i + 1}</span>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Drug name" placeholder="Paracetamol" {...register(`prescriptions.${i}.drug`)} />
                  <Input label="Dose" placeholder="500mg" {...register(`prescriptions.${i}.dose`)} />
                  <Input label="Frequency" placeholder="TID" {...register(`prescriptions.${i}.frequency`)} />
                  <Input label="Duration" placeholder="5 days" {...register(`prescriptions.${i}.duration`)} />
                </div>
                <Input label="Instructions" placeholder="After food" {...register(`prescriptions.${i}.instructions`)} />
              </div>
            ))}
          </Card>

          <div className="flex justify-end gap-3 pb-6">
            <Link href="/records">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={createRecord.isPending}>
              Save Record
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewRecordPage() {
  return (
    <Suspense>
      <NewRecordForm />
    </Suspense>
  );
}
