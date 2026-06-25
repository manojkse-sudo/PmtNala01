import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsApi } from "@/lib/api";
import { toast } from "@/store/ui";
import { extractApiError } from "@/lib/utils";
import type { Appointment } from "@/types";

export const APPTS_KEY = "appointments";

export function useAppointments(params?: {
  skip?: number; limit?: number;
  status?: string; date?: string; patient_id?: string;
}) {
  return useQuery({
    queryKey: [APPTS_KEY, params],
    queryFn: () => appointmentsApi.list(params),
    staleTime: 20_000,
  });
}

export function useTodayAppointments() {
  return useQuery({
    queryKey: [APPTS_KEY, "today"],
    queryFn: () => appointmentsApi.today(),
    staleTime: 60_000,
    refetchInterval: 2 * 60 * 1000, // refresh every 2 min
  });
}

export function useAppointmentStats() {
  return useQuery({
    queryKey: [APPTS_KEY, "stats"],
    queryFn: () => appointmentsApi.stats(),
    staleTime: 60_000,
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: [APPTS_KEY, id],
    queryFn: () => appointmentsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Appointment>) => appointmentsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [APPTS_KEY] });
      toast.success("Appointment booked");
    },
    onError: (err) => toast.error("Booking failed", extractApiError(err)),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      appointmentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [APPTS_KEY] });
      toast.success("Appointment updated");
    },
    onError: (err) => toast.error("Update failed", extractApiError(err)),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [APPTS_KEY] });
      toast.success("Appointment cancelled");
    },
    onError: (err) => toast.error("Cancellation failed", extractApiError(err)),
  });
}
