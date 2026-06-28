"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { casesApi } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import type { PatientMatch, PrescriptionRow } from "@/types";
import {
  Search, UserPlus, UserCheck, CheckCircle2, ChevronRight,
  Phone, Stethoscope, Pill, Plus, Trash2, Printer,
  FlaskConical, CalendarClock,
} from "lucide-react";

// ── Step types ────────────────────────────────────────────────────────────────
type Step = "lookup" | "confirm-patient" | "new-patient" | "case-details" | "done";

interface LookupForm { phone: string; first_name: string; last_name: string; }
interface NewPatientForm {
  first_name: string; last_name: string; phone: string;
  age: string; gender: string; blood_group: string;
  allergies: string; chronic_conditions: string;
}
interface CaseForm {
  chief_complaint: string;
  subjective: string;
  assessment: string;
  plan: string;
  follow_up_tests: string;
  follow_up_days: string;
  prescriptions: PrescriptionRow[];
}

const TIMING_OPTIONS = ["After food", "Before food", "With food", "Empty stomach"];
const EMPTY_RX: PrescriptionRow = { drug: "", dose: "", timing: "After food", days: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function naOrValue(v: string | undefined) {
  return v && v.trim() ? v.trim() : "NA";
}

function StepBadge({ step, label, current, done }: { step: number; label: string; current: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${current ? "text-primary" : done ? "text-green-600" : "text-gray-400"}`}>
      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${current ? "bg-primary text-white" : done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
        {done ? "✓" : step}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

// ── Print receipt ─────────────────────────────────────────────────────────────
interface PrintData {
  patientName: string;
  patientPhone?: string;
  patientNumber?: string;
  chiefComplaint: string;
  assessment: string;
  plan: string;
  prescriptions: PrescriptionRow[];
  followUpTests: string;
  followUpDays: string;
  doctorName: string;
  date: string;
}

function printReceipt(data: PrintData) {
  const rxRows = data.prescriptions
    .filter((r) => r.drug)
    .map(
      (r, i) =>
        `<tr>
          <td style="padding:6px 8px;border:1px solid #ddd;">${i + 1}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;font-weight:600">${r.drug}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${r.dose || "NA"}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${r.timing}</td>
          <td style="padding:6px 8px;border:1px solid #ddd;">${r.days || "NA"}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Case Receipt — ${data.patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 24px; }
    .header { border-bottom: 2px solid #1a56db; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
    .brand { font-size: 20px; font-weight: 700; color: #1a56db; }
    .date { font-size: 12px; color: #555; }
    .section { margin-bottom: 14px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #1a56db; margin-bottom: 6px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
    .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .field { font-size: 13px; margin-bottom: 2px; }
    .field span { font-weight: 600; }
    .rx-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .rx-table th { background: #eff6ff; color: #1a56db; font-weight: 600; padding: 6px 8px; border: 1px solid #ddd; text-align: left; }
    .footer { margin-top: 32px; text-align: right; font-size: 12px; color: #555; border-top: 1px solid #ddd; padding-top: 12px; }
    .sig { margin-top: 40px; border-top: 1px solid #333; width: 180px; float: right; text-align: center; font-size: 12px; padding-top: 4px; }
    @media print { body { padding: 12px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">NalaBase</div>
      <div style="font-size:12px;color:#555;">Electronic Health Record</div>
    </div>
    <div class="date">Date: ${data.date}</div>
  </div>

  <div class="section">
    <div class="section-title">Patient Details</div>
    <div class="patient-grid">
      <div class="field">Name: <span>${data.patientName}</span></div>
      <div class="field">Phone: <span>${data.patientPhone || "NA"}</span></div>
      ${data.patientNumber ? `<div class="field">Patient No: <span>${data.patientNumber}</span></div>` : ""}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Chief Complaint</div>
    <p>${data.chiefComplaint}</p>
  </div>

  <div class="section">
    <div class="section-title">Assessment / Diagnosis</div>
    <p style="white-space:pre-wrap">${data.assessment}</p>
  </div>

  <div class="section">
    <div class="section-title">Treatment Plan</div>
    <p style="white-space:pre-wrap">${data.plan}</p>
  </div>

  ${rxRows ? `
  <div class="section">
    <div class="section-title">Prescription</div>
    <table class="rx-table">
      <thead><tr>
        <th>#</th><th>Medicine</th><th>Dose</th><th>Timing</th><th>Days</th>
      </tr></thead>
      <tbody>${rxRows}</tbody>
    </table>
  </div>` : ""}

  ${data.followUpTests && data.followUpTests !== "NA" ? `
  <div class="section">
    <div class="section-title">Follow-up Tests / Scans</div>
    <p style="white-space:pre-wrap">${data.followUpTests}</p>
  </div>` : ""}

  ${data.followUpDays ? `
  <div class="section">
    <div class="section-title">Follow-up</div>
    <p>Review in <strong>${data.followUpDays} days</strong></p>
  </div>` : ""}

  <div style="clear:both">
    <div class="sig">Dr. ${data.doctorName}<br/>Signature</div>
  </div>

  <div class="footer">Generated by NalaBase &mdash; ${data.date}</div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=700,height=900");
  if (w) { w.document.write(html); w.document.close(); }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreateCasePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("lookup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<PatientMatch[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientMatch | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [caseResult, setCaseResult] = useState<{
    case_id: string; patient_name: string; patient_phone?: string; patient_number?: string;
  } | null>(null);

  const lookupForm = useForm<LookupForm>({ defaultValues: { phone: "", first_name: "", last_name: "" } });
  const newPatientForm = useForm<NewPatientForm>();
  const caseForm = useForm<CaseForm>({
    defaultValues: {
      chief_complaint: "", subjective: "", assessment: "", plan: "",
      follow_up_tests: "", follow_up_days: "",
      prescriptions: [{ ...EMPTY_RX }],
    },
  });

  const { fields: rxFields, append: addRx, remove: removeRx } = useFieldArray({
    control: caseForm.control,
    name: "prescriptions",
  });

  const stepOrder: Step[] = ["lookup", "confirm-patient", "new-patient", "case-details", "done"];
  const stepDone = (s: Step) => stepOrder.indexOf(step) > stepOrder.indexOf(s);

  // ── Step 1: Lookup ─────────────────────────────────────────────────────────
  const handleLookup = useCallback(async (data: LookupForm) => {
    if (!data.phone && !data.first_name && !data.last_name) {
      setError("Enter a phone number or patient name to search.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await casesApi.lookup({
        phone: data.phone || undefined,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
      });
      setMatches(res.matches);
      if (res.matches.length === 0) {
        setIsNewPatient(true);
        newPatientForm.setValue("first_name", data.first_name);
        newPatientForm.setValue("last_name", data.last_name);
        newPatientForm.setValue("phone", data.phone);
        setStep("new-patient");
      } else {
        setStep("confirm-patient");
      }
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [newPatientForm]);

  // ── Step 2a: Select existing patient ──────────────────────────────────────
  const handleSelectPatient = (p: PatientMatch) => {
    setSelectedPatient(p);
    setIsNewPatient(false);
    setStep("case-details");
  };

  // ── Step 2b: New patient info filled ──────────────────────────────────────
  const handleNewPatientNext = () => setStep("case-details");

  // ── Step 3: Submit case ───────────────────────────────────────────────────
  const handleCaseSubmit = async (data: CaseForm) => {
    setLoading(true);
    setError("");
    try {
      const lookup = lookupForm.getValues();
      const npData = newPatientForm.getValues();

      const prescriptions = data.prescriptions.filter((r) => r.drug.trim());

      const payload: Parameters<typeof casesApi.create>[0] = {
        // Use patient_id directly when an existing patient was selected
        ...(selectedPatient ? { patient_id: selectedPatient.id } : {}),

        // Lookup only when no patient_id (new patient path)
        ...(!selectedPatient ? {
          lookup: {
            phone: lookup.phone || undefined,
            first_name: lookup.first_name || undefined,
            last_name: lookup.last_name || undefined,
          },
        } : {}),

        ...(isNewPatient && {
          new_patient: {
            first_name: npData.first_name,
            last_name: npData.last_name,
            phone: npData.phone || undefined,
            age: npData.age ? Number(npData.age) : undefined,
            gender: npData.gender || undefined,
            blood_group: npData.blood_group || undefined,
            allergies: npData.allergies || undefined,
            chronic_conditions: npData.chronic_conditions || undefined,
          },
        }),

        chief_complaint: naOrValue(data.chief_complaint),
        subjective: naOrValue(data.subjective),
        assessment: naOrValue(data.assessment),
        plan: naOrValue(data.plan),
        follow_up_tests: naOrValue(data.follow_up_tests),
        follow_up_days: data.follow_up_days ? Number(data.follow_up_days) : undefined,
        prescriptions: prescriptions.map((r) => ({
          drug: r.drug,
          dose: naOrValue(r.dose),
          timing: r.timing || "After food",
          days: naOrValue(r.days),
        })),
      };

      const res = await casesApi.create(payload);
      setCaseResult({
        case_id: res.case_id,
        patient_name: res.patient_name,
        patient_phone: res.patient_phone,
        patient_number: selectedPatient?.patient_number,
      });
      setStep("done");
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  };

  // ── Print handler ─────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!caseResult) return;
    const cf = caseForm.getValues();
    const npData = newPatientForm.getValues();

    printReceipt({
      patientName: caseResult.patient_name,
      patientPhone: caseResult.patient_phone || selectedPatient?.phone || npData.phone,
      patientNumber: caseResult.patient_number,
      chiefComplaint: naOrValue(cf.chief_complaint),
      assessment: naOrValue(cf.assessment),
      plan: naOrValue(cf.plan),
      prescriptions: cf.prescriptions.filter((r) => r.drug.trim()),
      followUpTests: naOrValue(cf.follow_up_tests),
      followUpDays: cf.follow_up_days,
      doctorName: "Doctor",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    });
  };

  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Create Case" subtitle="Walk-in patient consultation" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Progress steps */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6 overflow-x-auto pb-1">
          <StepBadge step={1} label="Find Patient" current={step === "lookup"} done={stepDone("lookup")} />
          <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
          <StepBadge step={2} label="Patient" current={step === "confirm-patient" || step === "new-patient"} done={stepDone("new-patient") || stepDone("confirm-patient")} />
          <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
          <StepBadge step={3} label="Case Notes" current={step === "case-details"} done={stepDone("case-details")} />
          <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
          <StepBadge step={4} label="Done" current={step === "done"} done={false} />
        </div>

        <div className="max-w-2xl mx-auto">

          {/* ── Step 1: Lookup ──────────────────────────────────────────────── */}
          {step === "lookup" && (
            <Card>
              <CardTitle className="mb-1 flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Find Patient
              </CardTitle>
              <p className="text-sm text-gray-500 mb-5">Search by phone number or name.</p>
              <form onSubmit={lookupForm.handleSubmit(handleLookup)} className="space-y-4">
                <Input
                  label="Phone Number"
                  placeholder="9876543210"
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                  {...lookupForm.register("phone")}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" placeholder="Priya" {...lookupForm.register("first_name")} />
                  <Input label="Last Name" placeholder="Nair" {...lookupForm.register("last_name")} />
                </div>
                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
                <Button type="submit" loading={loading} className="w-full">
                  <Search className="h-4 w-4" /> Search
                </Button>
              </form>
            </Card>
          )}

          {/* ── Step 2a: Confirm existing patient ──────────────────────────── */}
          {step === "confirm-patient" && (
            <div className="space-y-3">
              <Card>
                <CardTitle className="mb-1 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Select Patient
                </CardTitle>
                <p className="text-sm text-gray-500 mb-4">{matches.length} record(s) found.</p>
                <div className="space-y-2">
                  {matches.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPatient(p)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary-50 transition-all text-left group"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                        {p.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{p.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {p.patient_number && <span className="mr-3">{p.patient_number}</span>}
                          {p.phone && <span>{p.phone}</span>}
                          {p.date_of_birth && <span className="ml-3">DOB: {p.date_of_birth}</span>}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              </Card>
              <Button variant="ghost" className="w-full" onClick={() => { setIsNewPatient(true); setStep("new-patient"); }}>
                <UserPlus className="h-4 w-4" /> None of these — register new patient
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep("lookup")}>Back to Search</Button>
            </div>
          )}

          {/* ── Step 2b: New patient form ──────────────────────────────────── */}
          {step === "new-patient" && (
            <Card>
              <CardTitle className="mb-1 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-secondary-600" /> Register New Patient
              </CardTitle>
              <p className="text-sm text-gray-500 mb-5">No existing record found. Fill in basic details.</p>
              <form onSubmit={newPatientForm.handleSubmit(handleNewPatientNext)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name *" placeholder="Priya" {...newPatientForm.register("first_name", { required: true })} />
                  <Input label="Last Name *" placeholder="Nair" {...newPatientForm.register("last_name", { required: true })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Phone" placeholder="9876543210" {...newPatientForm.register("phone")} />
                  <Input label="Age" type="number" placeholder="35" {...newPatientForm.register("age")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                    <select className="w-full h-9 px-3 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary" {...newPatientForm.register("gender")}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Blood Group</label>
                    <select className="w-full h-9 px-3 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary" {...newPatientForm.register("blood_group")}>
                      <option value="">Unknown</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Known Allergies" placeholder="Penicillin, Sulfa..." {...newPatientForm.register("allergies")} />
                <Input label="Chronic Conditions" placeholder="Diabetes, Hypertension..." {...newPatientForm.register("chronic_conditions")} />
                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setStep("lookup")}>Back</Button>
                  <Button type="submit" className="flex-1">Continue to Case Notes</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── Step 3: Case Notes ─────────────────────────────────────────── */}
          {step === "case-details" && (
            <div className="space-y-4">
              {/* Patient banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-200">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {isNewPatient
                    ? (newPatientForm.getValues("first_name")[0] || "N").toUpperCase()
                    : (selectedPatient?.full_name[0] || "P").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {isNewPatient
                      ? `${newPatientForm.getValues("first_name")} ${newPatientForm.getValues("last_name")}`
                      : selectedPatient?.full_name}
                  </p>
                  <p className="text-xs text-primary-600">
                    {isNewPatient
                      ? "New patient — will be registered on save"
                      : `${selectedPatient?.patient_number || ""} · ${selectedPatient?.phone || ""}`.replace(/^·\s*/, "")}
                  </p>
                </div>
              </div>

              <form onSubmit={caseForm.handleSubmit(handleCaseSubmit)} className="space-y-4">
                {/* Consultation Notes */}
                <Card>
                  <CardTitle className="mb-4 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" /> Consultation Notes
                  </CardTitle>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Chief Complaint</label>
                      <input
                        className="w-full h-9 px-3 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Fever and headache for 2 days"
                        {...caseForm.register("chief_complaint")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">History / Subjective</label>
                      <textarea rows={2} className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Patient history, complaints..." {...caseForm.register("subjective")} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Assessment / Diagnosis</label>
                      <textarea rows={2} className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Clinical diagnosis..." {...caseForm.register("assessment")} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Plan / Instructions</label>
                      <textarea rows={2} className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Treatment plan, advice..." {...caseForm.register("plan")} />
                    </div>
                    <div className="w-32">
                      <Input label="Follow-up (days)" type="number" placeholder="7" {...caseForm.register("follow_up_days")} />
                    </div>
                  </div>
                </Card>

                {/* Prescription table */}
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-4 w-4 text-secondary-600" /> Prescription
                    </CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addRx({ ...EMPTY_RX })}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Row
                    </Button>
                  </div>

                  {/* Header */}
                  <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 px-1">
                    <span>Medicine Name</span><span>Dose</span><span>Timing</span><span>Days</span><span />
                  </div>

                  <div className="space-y-2">
                    {rxFields.map((field, idx) => (
                      <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-start">
                        <input
                          className="h-8 px-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Medicine name"
                          {...caseForm.register(`prescriptions.${idx}.drug`)}
                        />
                        <input
                          className="h-8 px-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="500mg"
                          {...caseForm.register(`prescriptions.${idx}.dose`)}
                        />
                        <select
                          className="h-8 px-2 text-sm border border-input rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                          {...caseForm.register(`prescriptions.${idx}.timing`)}
                        >
                          {TIMING_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input
                          className="h-8 px-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="5 days"
                          {...caseForm.register(`prescriptions.${idx}.days`)}
                        />
                        <button
                          type="button"
                          onClick={() => rxFields.length > 1 && removeRx(idx)}
                          disabled={rxFields.length === 1}
                          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2">Leave medicine name blank to skip that row.</p>
                </Card>

                {/* Follow-up Tests */}
                <Card>
                  <CardTitle className="mb-3 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-accent-700" /> Follow-up Tests / Scans
                  </CardTitle>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="e.g. CBC, Blood Sugar Fasting, Chest X-Ray, ECG..."
                    {...caseForm.register("follow_up_tests")}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">List any lab tests, scans, or investigations for the patient to take.</p>
                </Card>

                {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</p>}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setStep(isNewPatient ? "new-patient" : "confirm-patient")}
                  >
                    Back
                  </Button>
                  <Button type="submit" loading={loading} className="flex-1">
                    Save Case
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 4: Done ──────────────────────────────────────────────── */}
          {step === "done" && caseResult && (
            <Card className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">Case Saved</h2>
              <p className="text-sm text-gray-500 mb-2">
                Case record created for{" "}
                <span className="font-semibold text-gray-800">{caseResult.patient_name}</span>
              </p>
              {caseResult.patient_phone && (
                <p className="text-xs text-gray-400 mb-6">{caseResult.patient_phone}</p>
              )}

              {/* Summary of what was saved */}
              {caseForm.watch("prescriptions").filter((r) => r.drug.trim()).length > 0 && (
                <div className="text-left mb-6 bg-gray-50 rounded-xl p-4 max-w-sm mx-auto">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Prescription</p>
                  {caseForm.watch("prescriptions").filter((r) => r.drug.trim()).map((r, i) => (
                    <p key={i} className="text-sm text-gray-700">
                      {i + 1}. {r.drug} · {r.dose || "—"} · {r.timing} · {r.days || "—"}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push("/patients")}>
                  View Patients
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
                <Button onClick={() => {
                  setStep("lookup");
                  setError(""); setMatches([]); setSelectedPatient(null);
                  setIsNewPatient(false); setCaseResult(null);
                  lookupForm.reset(); newPatientForm.reset();
                  caseForm.reset({
                    chief_complaint: "", subjective: "", assessment: "",
                    plan: "", follow_up_tests: "", follow_up_days: "",
                    prescriptions: [{ ...EMPTY_RX }],
                  });
                }}>
                  <Plus className="h-4 w-4" /> New Case
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
