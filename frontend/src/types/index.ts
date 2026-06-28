// ─── Auth ────────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  specialty?: string;
  clinic_name?: string;
  clinic_address?: string;
  license_number?: string;
  avatar_url?: string;
  timezone: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  doctor: Doctor;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  specialty?: string;
  clinic_name?: string;
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "Unknown";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface Patient {
  id: string;
  doctor_id: string;
  patient_number?: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  gender?: Gender;
  blood_group?: BloodGroup;
  email?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  allergies?: string;
  chronic_conditions?: string;
  current_medications?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PatientListResponse {
  items: Patient[];
  total: number;
  skip: number;
  limit: number;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export type AppointmentType =
  | "consultation" | "follow_up" | "emergency" | "procedure" | "teleconsult";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  patient?: Patient;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  chief_complaint?: string;
  notes?: string;
  fee?: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentListResponse {
  items: Appointment[];
  total: number;
  skip: number;
  limit: number;
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
}

// ─── Medical Record ───────────────────────────────────────────────────────────

export interface Prescription {
  drug: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface DiagnosisCode {
  code: string;
  description: string;
}

export interface LabOrder {
  test: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_id?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  diagnosis_codes?: DiagnosisCode[];
  prescriptions?: Prescription[];
  lab_orders?: LabOrder[];
  follow_up_days?: number;
  created_at: string;
  updated_at: string;
}

export interface Vitals {
  id: string;
  patient_id: string;
  doctor_id: string;
  temperature_c?: number;
  pulse_bpm?: number;
  bp_systolic?: number;
  bp_diastolic?: number;
  spo2_percent?: number;
  weight_kg?: number;
  height_cm?: number;
  respiratory_rate?: number;
  bmi?: number;
  created_at: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_patients: number;
  total_appointments: number;
  today_appointments: number;
  scheduled_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export type InventoryCategory =
  | "medicine" | "consumable" | "equipment" | "general";

export interface InventoryItem {
  id: string;
  doctor_id: string;
  name: string;
  category: InventoryCategory | string;
  description?: string;
  unit: string;
  quantity: number;
  reorder_level: number;
  cost_per_unit?: number;
  supplier?: string;
  batch_number?: string;
  expiry_date?: string;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  low_stock_count: number;
}

// ─── Site Settings ────────────────────────────────────────────────────────────

export interface SiteSettingsMap {
  settings: Record<string, string>;
}

// ─── Cases (Walk-in) ─────────────────────────────────────────────────────────

export interface PatientLookup {
  phone?: string;
  first_name?: string;
  last_name?: string;
  age?: number;
  date_of_birth?: string;
}

export interface PatientMatch {
  id: string;
  full_name: string;
  phone?: string;
  patient_number?: string;
  date_of_birth?: string;
}

export interface CaseCreate {
  lookup: PatientLookup;
  new_patient?: {
    first_name: string;
    last_name: string;
    phone?: string;
    date_of_birth?: string;
    age?: number;
    gender?: string;
    blood_group?: string;
    allergies?: string;
    chronic_conditions?: string;
  };
  chief_complaint?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  prescriptions?: Array<{ drug: string; dose: string; frequency: string; duration: string; instructions?: string }>;
  follow_up_days?: number;
}

export interface CaseResponse {
  case_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  is_new_patient: boolean;
  created_at: string;
}

// ─── Trends ──────────────────────────────────────────────────────────────────

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendsResponse {
  daily: TrendPoint[];
  weekly_total: number;
  monthly_total: number;
  today_total: number;
}

// ─── Admin Doctor ─────────────────────────────────────────────────────────────

export interface AdminDoctor {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  specialty?: string;
  clinic_name?: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
  search?: string;
}
