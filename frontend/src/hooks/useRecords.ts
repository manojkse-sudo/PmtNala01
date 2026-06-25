import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordsApi } from "@/lib/api";
import { toast } from "@/store/ui";
import { extractApiError } from "@/lib/utils";
import type { MedicalRecord, Vitals } from "@/types";

export const RECORDS_KEY = "records";
export const VITALS_KEY = "vitals";

export function usePatientRecords(patientId: string) {
  return useQuery({
    queryKey: [RECORDS_KEY, "patient", patientId],
    queryFn: () => recordsApi.listForPatient(patientId),
    enabled: !!patientId,
  });
}

export function useRecord(id: string) {
  return useQuery({
    queryKey: [RECORDS_KEY, id],
    queryFn: () => recordsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MedicalRecord> & { patient_id: string }) =>
      recordsApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: [RECORDS_KEY, "patient", vars.patient_id] });
      toast.success("Record saved");
    },
    onError: (err) => toast.error("Failed to save record", extractApiError(err)),
  });
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalRecord> }) =>
      recordsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [RECORDS_KEY] });
      toast.success("Record updated");
    },
    onError: (err) => toast.error("Update failed", extractApiError(err)),
  });
}

export function useVitalsHistory(patientId: string) {
  return useQuery({
    queryKey: [VITALS_KEY, patientId],
    queryFn: () => recordsApi.getVitalsHistory(patientId),
    enabled: !!patientId,
  });
}

export function useAddVitals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ patientId, data }: { patientId: string; data: Partial<Vitals> }) =>
      recordsApi.addVitals(patientId, data),
    onSuccess: (_, { patientId }) => {
      qc.invalidateQueries({ queryKey: [VITALS_KEY, patientId] });
      toast.success("Vitals recorded");
    },
    onError: (err) => toast.error("Failed to record vitals", extractApiError(err)),
  });
}
