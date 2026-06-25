"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/FormControls";
import { Card } from "@/components/ui/Card";
import { useCreatePatient } from "@/hooks/usePatients";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  blood_group: z.enum(["A+","A-","B+","B-","AB+","AB-","O+","O-","Unknown"]).optional(),
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
    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

export default function NewPatientPage() {
  const router = useRouter();
  const createPatient = useCreatePatient();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // Clean empty strings
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined)
    );
    await createPatient.mutateAsync(cleaned);
    router.push("/patients");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Add Patient"
        actions={
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-4">
          {/* Basic Info */}
          <Card>
            <SectionHeading>Basic Information</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                required
                placeholder="Arjun"
                {...register("first_name")}
                error={errors.first_name?.message}
              />
              <Input
                label="Last Name"
                required
                placeholder="Sharma"
                {...register("last_name")}
                error={errors.last_name?.message}
              />
              <Input
                label="Date of Birth"
                type="date"
                {...register("date_of_birth")}
              />
              <Select
                label="Gender"
                options={GENDER_OPTIONS}
                placeholder="Select gender"
                {...register("gender")}
              />
              <Select
                label="Blood Group"
                options={BLOOD_OPTIONS}
                placeholder="Select blood group"
                {...register("blood_group")}
              />
            </div>
          </Card>

          {/* Contact */}
          <Card>
            <SectionHeading>Contact</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" placeholder="+91 98765 43210" {...register("phone")} />
              <Input label="Email" type="email" placeholder="patient@example.com" {...register("email")} error={errors.email?.message} />
              <Input label="Emergency Contact Name" {...register("emergency_contact_name")} />
              <Input label="Emergency Contact Phone" {...register("emergency_contact_phone")} />
            </div>
          </Card>

          {/* Address */}
          <Card>
            <SectionHeading>Address</SectionHeading>
            <div className="grid grid-cols-2 gap-4">
              <Textarea label="Street Address" className="col-span-2" {...register("address")} />
              <Input label="City" {...register("city")} />
              <Input label="State" {...register("state")} />
              <Input label="Pincode" {...register("pincode")} />
            </div>
          </Card>

          {/* Medical Background */}
          <Card>
            <SectionHeading>Medical Background</SectionHeading>
            <div className="space-y-4">
              <Textarea label="Allergies" placeholder="Penicillin, Sulfa drugs…" {...register("allergies")} />
              <Textarea label="Chronic Conditions" placeholder="Hypertension, Type 2 Diabetes…" {...register("chronic_conditions")} />
              <Textarea label="Current Medications" placeholder="Metformin 500mg OD…" {...register("current_medications")} />
              <Textarea label="Notes" placeholder="Any additional notes about this patient…" {...register("notes")} />
            </div>
          </Card>

          <div className="flex justify-end gap-3 pb-6">
            <Link href="/patients">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" loading={createPatient.isPending}>
              Save Patient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
