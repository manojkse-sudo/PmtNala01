import api from "./api-client";
import type {
  LoginPayload, RegisterPayload, TokenResponse, Doctor,
  Patient, PatientListResponse,
  Appointment, AppointmentListResponse, AppointmentStats,
  MedicalRecord, Vitals,
  DashboardStats,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginPayload) =>
    api.post<TokenResponse>("/auth/login", data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    api.post<TokenResponse>("/auth/register", data).then((r) => r.data),

  me: () => api.get<Doctor>("/auth/me").then((r) => r.data),

  updateProfile: (data: Partial<Doctor>) =>
    api.patch<Doctor>("/auth/me", data).then((r) => r.data),
};

// ─── Patients ────────────────────────────────────────────────────────────────

export const patientsApi = {
  list: (params?: { skip?: number; limit?: number; search?: string }) =>
    api.get<PatientListResponse>("/patients", { params }).then((r) => r.data),

  get: (id: string) =>
    api.get<Patient>(`/patients/${id}`).then((r) => r.data),

  create: (data: Partial<Patient>) =>
    api.post<Patient>("/patients", data).then((r) => r.data),

  update: (id: string, data: Partial<Patient>) =>
    api.patch<Patient>(`/patients/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/patients/${id}`),
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointmentsApi = {
  list: (params?: {
    skip?: number; limit?: number;
    status?: string; date?: string; patient_id?: string;
  }) =>
    api.get<AppointmentListResponse>("/appointments", { params }).then((r) => r.data),

  today: () =>
    api.get<Appointment[]>("/appointments/today").then((r) => r.data),

  stats: () =>
    api.get<AppointmentStats>("/appointments/stats").then((r) => r.data),

  get: (id: string) =>
    api.get<Appointment>(`/appointments/${id}`).then((r) => r.data),

  create: (data: Partial<Appointment>) =>
    api.post<Appointment>("/appointments", data).then((r) => r.data),

  update: (id: string, data: Partial<Appointment>) =>
    api.patch<Appointment>(`/appointments/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/appointments/${id}`),
};

// ─── Medical Records ──────────────────────────────────────────────────────────

export const recordsApi = {
  listForPatient: (patientId: string, params?: { skip?: number; limit?: number }) =>
    api.get<{ items: MedicalRecord[]; total: number }>(
      `/records/patient/${patientId}`, { params }
    ).then((r) => r.data),

  get: (id: string) =>
    api.get<MedicalRecord>(`/records/${id}`).then((r) => r.data),

  create: (data: Partial<MedicalRecord> & { patient_id: string }) =>
    api.post<MedicalRecord>("/records", data).then((r) => r.data),

  update: (id: string, data: Partial<MedicalRecord>) =>
    api.patch<MedicalRecord>(`/records/${id}`, data).then((r) => r.data),

  addVitals: (patientId: string, data: Partial<Vitals>) =>
    api.post<Vitals>(`/records/patient/${patientId}/vitals`, data).then((r) => r.data),

  getVitalsHistory: (patientId: string) =>
    api.get<Vitals[]>(`/records/patient/${patientId}/vitals`).then((r) => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
};
