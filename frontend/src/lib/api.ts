import api from "./api-client";
import type {
  LoginPayload, RegisterPayload, TokenResponse, Doctor,
  Patient, PatientListResponse,
  Appointment, AppointmentListResponse, AppointmentStats,
  MedicalRecord, Vitals,
  DashboardStats,
  InventoryItem, InventoryListResponse,
  SiteSettingsMap,
  CaseCreate, CaseResponse, PatientMatch,
  TrendsResponse,
  AdminDoctor,
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
  trends: () => api.get<TrendsResponse>("/dashboard/trends").then((r) => r.data),
};

// ─── Cases (Walk-in) ─────────────────────────────────────────────────────────

export const casesApi = {
  lookup: (params: { phone?: string; first_name?: string; last_name?: string }) =>
    api.get<{ matches: PatientMatch[] }>("/cases/lookup", { params }).then((r) => r.data),

  create: (data: CaseCreate) =>
    api.post<CaseResponse>("/cases", data).then((r) => r.data),
};

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryApi = {
  list: (params?: { skip?: number; limit?: number; search?: string; category?: string; low_stock_only?: boolean }) =>
    api.get<InventoryListResponse>("/inventory", { params }).then((r) => r.data),

  create: (data: Partial<InventoryItem>) =>
    api.post<InventoryItem>("/inventory", data).then((r) => r.data),

  update: (id: string, data: Partial<InventoryItem>) =>
    api.patch<InventoryItem>(`/inventory/${id}`, data).then((r) => r.data),

  adjust: (id: string, delta: number) =>
    api.post<InventoryItem>(`/inventory/${id}/adjust`, null, { params: { delta } }).then((r) => r.data),

  delete: (id: string) => api.delete(`/inventory/${id}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  getSettings: () => api.get<SiteSettingsMap>("/admin/settings/public").then((r) => r.data),

  updateSettings: (updates: Record<string, string>) =>
    api.patch<SiteSettingsMap>("/admin/settings", updates).then((r) => r.data),

  listDoctors: () =>
    api.get<AdminDoctor[]>("/admin/doctors").then((r) => r.data),

  createDoctor: (data: Partial<AdminDoctor> & { password: string }) =>
    api.post<AdminDoctor>("/admin/doctors", data).then((r) => r.data),

  updateDoctor: (id: string, data: Partial<AdminDoctor>) =>
    api.patch<AdminDoctor>(`/admin/doctors/${id}`, data).then((r) => r.data),

  deactivateDoctor: (id: string) =>
    api.delete(`/admin/doctors/${id}`),
};
