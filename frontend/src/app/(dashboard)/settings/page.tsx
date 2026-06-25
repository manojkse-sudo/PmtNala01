"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/FormControls";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api";
import { toast } from "@/store/ui";
import { extractApiError } from "@/lib/utils";
import { useState } from "react";

const schema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  clinic_name: z.string().optional(),
  clinic_address: z.string().optional(),
  license_number: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { doctor, updateDoctor } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: doctor?.first_name ?? "",
      last_name: doctor?.last_name ?? "",
      phone: doctor?.phone ?? "",
      specialty: doctor?.specialty ?? "",
      clinic_name: doctor?.clinic_name ?? "",
      clinic_address: doctor?.clinic_address ?? "",
      license_number: doctor?.license_number ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const updated = await authApi.updateProfile(data);
      updateDoctor(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Update failed", extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Settings" subtitle="Manage your profile and preferences" />

      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
          <Card>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Personal</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" {...register("first_name")} error={errors.first_name?.message} />
              <Input label="Last Name" {...register("last_name")} error={errors.last_name?.message} />
              <Input label="Phone" {...register("phone")} />
              <Input label="Specialty" {...register("specialty")} />
              <Input label="License Number" {...register("license_number")} />
            </div>
          </Card>

          <Card>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Clinic</h3>
            <div className="space-y-4">
              <Input label="Clinic Name" {...register("clinic_name")} />
              <Textarea label="Clinic Address" {...register("clinic_address")} />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
