import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientsApi } from "@/lib/api";
import { toast } from "@/store/ui";
import { extractApiError } from "@/lib/utils";
import type { Patient } from "@/types";

export const PATIENTS_KEY = "patients";

export function usePatients(params?: { skip?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [PATIENTS_KEY, params],
    queryFn: () => patientsApi.list(params),
    staleTime: 30_000,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: [PATIENTS_KEY, id],
    queryFn: () => patientsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Patient>) => patientsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      toast.success("Patient added", "The patient record has been created.");
    },
    onError: (err) => toast.error("Failed to add patient", extractApiError(err)),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Patient> }) =>
      patientsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY, id] });
      toast.success("Patient updated");
    },
    onError: (err) => toast.error("Update failed", extractApiError(err)),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PATIENTS_KEY] });
      toast.success("Patient removed");
    },
    onError: (err) => toast.error("Delete failed", extractApiError(err)),
  });
}
