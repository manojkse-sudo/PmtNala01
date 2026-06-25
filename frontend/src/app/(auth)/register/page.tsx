"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Stethoscope } from "lucide-react";
import { extractApiError } from "@/lib/utils";

const schema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  specialty: z.string().optional(),
  clinic_name: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setApiError("");
    try {
      const res = await authApi.register(data);
      setAuth(res.doctor, res.access_token, res.refresh_token);
      router.replace("/dashboard");
    } catch (err) {
      setApiError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Brand */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center mb-3 shadow-md">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Start your NalaBase practice</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="Priya"
            {...register("first_name")}
            error={errors.first_name?.message}
          />
          <Input
            label="Last Name"
            placeholder="Nair"
            {...register("last_name")}
            error={errors.last_name?.message}
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="doctor@clinic.com"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          {...register("password")}
          error={errors.password?.message}
        />
        <Input
          label="Specialty"
          placeholder="General Medicine"
          {...register("specialty")}
        />
        <Input
          label="Clinic Name"
          placeholder="Sunshine Clinic"
          {...register("clinic_name")}
        />

        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg">
            {apiError}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
