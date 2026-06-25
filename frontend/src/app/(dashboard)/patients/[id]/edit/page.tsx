"use client";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/FormControls";
import { Card, Skeleton } from "@/components/ui/Card";
import { usePatient, useUpdatePatient } from "@/hooks/usePatients";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional().or(z.literal("")),
  blood_group: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"]).optional().or(z.literal("")),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  allergies: z.string().optional(),
  chronic_conditions: z.string().optional(),
  current_medications: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const BLOOD_OPTIONS = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"].map((v) => ({ value: v, label: v }));

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{children}</h3>
  );
}

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(id);
  const updatePatient = useUpdatePatient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Pre-fill form once patient data is loaded
  useEffect(() => {
    if (patient) {
      reset({
        first_name: patient.first_name,
        last_name: patient.last_name,
        date_of_birth: patient.date_of_birth ?? "",
        gender: patient.gender ?? "",
        blood_group: patient.blood_group ?? "",
        phone: patient.phone ?? "",
        email: patient.email ?? "",
        emergency_contact_name: patient.emergency_contact_name ?? "",
        emergency_contact_phone: patient.emergency_contact_phone ?? "",
        address: patient.address ?? "",
        city: patient.city ?? "",
        state: patient.state ?? "",
        pincode: patient.pincode ?? "",
        allergies: patient.allergies ?? "",
        chronic_conditions: patient.chronic_conditions ?? "",
        current_medications: patient.current_medications ?? "",
        notes: patient.notes ?? "",
      });
    }
  }, [patient, reset]);

  const onSubmit = async (data: FormData) => {
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined)
    );
    await updatePatient.mutateAsync({ id, data: cleaned });
    router.push(`/patients/${id}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={`Edit — ${patient?.full_name ?? "Patient"}`}
        actions={
          <Link href={`/patients/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4">
          <Card>
            <SectionHeading>Basic Information</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" required {...register("first_name")} error={errors.first_name?.message} />
              <Input label="Last Name" required {...register("last_name")} error={errors.last_name?.message} />
              <Input label="Date of Birth" type="date" {...register("date_of_birth")} />
              <Select label="Gender" options={GENDER_OPTIONS} placeholder="Select gender" {...register("gender")} />
              <Select label="Blood Group" options={BLOOD_OPTIONS} placeholder="Select blood group" {...register("blood_group")} />
            </div>
          </Card>

          <Card>
            <SectionHeading>Contact</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" {...register("phone")} />
              <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
              <Input label="Emergency Contact Name" {...register("emergency_contact_name")} />
              <Input label="Emergency Contact Phone" {...register("emergency_contact_phone")} />
            </div>
          </Card>

          <Card>
            <SectionHeading>Address</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Street Address" className="col-span-2" {...register("address")} />
              <Input label="City" {...register("city")} />
              <Input label="State" {...register("state")} />
              <Input label="Pincode" {...register("pincode")} />
            </div>
          </Card>

          <Card>
            <SectionHeading>Medical Background</SectionHeading>
            <div className="space-y-4">
              <Textarea label="Allergies" {...register("allergies")} />
              <Textarea label="Chronic Conditions" {...register("chronic_conditions")} />
              <Textarea label="Current Medications" {...register("current_medications")} />
              <Textarea label="Notes" {...register("notes")} />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pb-6">
            <Link href={`/patients/${id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={updatePatient.isPending}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
