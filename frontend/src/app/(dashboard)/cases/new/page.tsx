"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { casesApi } from "@/lib/api";
import { extractApiError } from "@/lib/utils";
import type { PatientMatch } from "@/types";
import {
  Search, UserPlus, UserCheck, CheckCircle2, ChevronRight,
  Phone, Calendar, User, Stethoscope, Pill,
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
  subjective: string; assessment: string; plan: string;
  follow_up_days: string;
  drug1: string; dose1: string; freq1: string; dur1: string;
  drug2: string; dose2: string; freq2: string; dur2: string;
  drug3: string; dose3: string; freq3: string; dur3: string;
}

function StepBadge({ step, label, current }: { step: number; label: string; current: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${current ? "text-primary" : "text-gray-400"}`}>
      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${current ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
        {step}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

export default function CreateCasePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("lookup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState<PatientMatch[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientMatch | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [caseResult, setCaseResult] = useState<{ case_id: string; patient_name: string } | null>(null);

  const lookupForm = useForm<LookupForm>({ defaultValues: { phone: "", first_name: "", last_name: "" } });
  const newPatientForm = useForm<NewPatientForm>();
  const caseForm = useForm<CaseForm>();

  // ── Step 1: Lookup ─────────────────────────────────────────────────────────
  const handleLookup = useCallback(async (data: LookupForm) => {
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
        // Pre-fill new patient form with lookup data
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

  // ── Step 2a: Confirm existing patient ─────────────────────────────────────
  const handleSelectPatient = (p: PatientMatch) => {
    setSelectedPatient(p);
    setIsNewPatient(false);
    setStep("case-details");
  };

  // ── Step 2b: New patient confirmed ────────────────────────────────────────
  const handleNewPatientNext = (data: NewPatientForm) => {
    setStep("case-details");
  };

  // ── Step 3: Submit case ───────────────────────────────────────────────────
  const handleCaseSubmit = async (data: CaseForm) => {
    setLoading(true);
    setError("");
    try {
      const lookup = lookupForm.getValues();
      const npData = newPatientForm.getValues();

      const prescriptions: Array<{ drug: string; dose: string; frequency: string; duration: string }> = [];
      if (data.drug1) prescriptions.push({ drug: data.drug1, dose: data.dose1, frequency: data.freq1, duration: data.dur1 });
      if (data.drug2) prescriptions.push({ drug: data.drug2, dose: data.dose2, frequency: data.freq2, duration: data.dur2 });
      if (data.drug3) prescriptions.push({ drug: data.drug3, dose: data.dose3, frequency: data.freq3, duration: data.dur3 });

      const payload = {
        lookup: {
          phone: lookup.phone || undefined,
          first_name: lookup.first_name || undefined,
          last_name: lookup.last_name || undefined,
        },
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
        chief_complaint: data.chief_complaint || undefined,
        subjective: data.subjective || undefined,
        assessment: data.assessment || undefined,
        plan: data.plan || undefined,
        prescriptions: prescriptions.length > 0 ? prescriptions : undefined,
        follow_up_days: data.follow_up_days ? Number(data.follow_up_days) : undefined,
      };

      const res = await casesApi.create(payload);
      setCaseResult({ case_id: res.case_id, patient_name: res.patient_name });
      setStep("done");
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Create Case" subtitle="Walk-in patient consultation" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Progress steps */}
        <div className="flex items-center gap-3 mb-6">
          <StepBadge step={1} label="Find Patient" current={step === "lookup"} />
          <ChevronRight className="h-3 w-3 text-gray-300" />
          <StepBadge step={2} label="Patient Details" current={step === "confirm-patient" || step === "new-patient"} />
          <ChevronRight className="h-3 w-3 text-gray-300" />
          <StepBadge step={3} label="Case Notes" current={step === "case-details"} />
          <ChevronRight className="h-3 w-3 text-gray-300" />
          <StepBadge step={4} label="Done" current={step === "done"} />
        </div>

        <div className="max-w-2xl">

          {/* ── Step 1: Lookup ────────────────────────────────────────────── */}
          {step === "lookup" && (
            <Card>
              <CardTitle className="mb-1 flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Find Patient
              </CardTitle>
              <p className="text-sm text-gray-500 mb-5">
                Enter phone number or name to search existing patients.
              </p>
              <form onSubmit={lookupForm.handleSubmit(handleLookup)} className="space-y-4">
                <Input
                  label="Phone Number"
                  placeholder="e.g. 9876543210"
                  leftIcon={<Phone className="h-3.5 w-3.5" />}
                  {...lookupForm.register("phone")}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" placeholder="Priya" {...lookupForm.register("first_name")} />
                  <Input label="Last Name" placeholder="Nair" {...lookupForm.register("last_name")} />
                </div>
                {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                <Button type="submit" loading={loading} className="w-full">
                  <Search className="h-4 w-4" /> Search Patient
                </Button>
              </form>
            </Card>
          )}

          {/* ── Step 2a: Choose from matches ──────────────────────────────── */}
          {step === "confirm-patient" && (
            <div className="space-y-3">
              <Card>
                <CardTitle className="mb-1 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" /> Select Patient
                </CardTitle>
                <p className="text-sm text-gray-500 mb-4">{matches.length} record(s) found. Select the correct patient.</p>
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
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => { setIsNewPatient(true); setStep("new-patient"); }}
              >
                <UserPlus className="h-4 w-4" /> None of these — Register new patient
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep("lookup")}>Back to Search</Button>
            </div>
          )}

          {/* ── Step 2b: New patient form ─────────────────────────────────── */}
          {step === "new-patient" && (
            <Card>
              <CardTitle className="mb-1 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-secondary-600" /> Register New Patient
              </CardTitle>
              <p className="text-sm text-gray-500 mb-5">
                No existing record found. Fill in basic details to register this patient.
              </p>
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
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <Input label="Known Allergies" placeholder="Penicillin, Sulfa..." {...newPatientForm.register("allergies")} />
                <Input label="Chronic Conditions" placeholder="Diabetes, Hypertension..." {...newPatientForm.register("chronic_conditions")} />
                {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setStep("lookup")}>Back</Button>
                  <Button type="submit" className="flex-1">Continue to Case Notes</Button>
                </div>
              </form>
            </Card>
          )}

          {/* ── Step 3: Case Notes ────────────────────────────────────────── */}
          {step === "case-details" && (
            <div className="space-y-4">
              {/* Patient banner */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-200">
                <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {isNewPatient
                    ? (newPatientForm.getValues("first_name")[0] || "N").toUpperCase()
                    : (selectedPatient?.full_name[0] || "P").toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {isNewPatient
                      ? `${newPatientForm.getValues("first_name")} ${newPatientForm.getValues("last_name")}`
                      : selectedPatient?.full_name
                    }
                  </p>
                  <p className="text-xs text-primary-600">
                    {isNewPatient ? "New patient — will be registered" : `${selectedPatient?.patient_number || ""} · ${selectedPatient?.phone || ""}`}
                  </p>
                </div>
              </div>

              <form onSubmit={caseForm.handleSubmit(handleCaseSubmit)} className="space-y-4">
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Subjective (History)</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Patient complaints, history..."
                        {...caseForm.register("subjective")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Assessment / Diagnosis</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Clinical diagnosis..."
                        {...caseForm.register("assessment")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Plan / Instructions</label>
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        placeholder="Treatment plan, referrals..."
                        {...caseForm.register("plan")}
                      />
                    </div>
                    <Input
                      label="Follow-up (days)"
                      type="number"
                      placeholder="7"
                      {...caseForm.register("follow_up_days")}
                    />
                  </div>
                </Card>

                <Card>
                  <CardTitle className="mb-4 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-secondary-600" /> Prescriptions
                  </CardTitle>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="grid grid-cols-4 gap-2">
                        <input className="col-span-1 h-8 px-2 text-xs border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder={`Drug ${i}`} {...caseForm.register(`drug${i}` as "drug1")} />
                        <input className="h-8 px-2 text-xs border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Dose" {...caseForm.register(`dose${i}` as "dose1")} />
                        <input className="h-8 px-2 text-xs border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Freq" {...caseForm.register(`freq${i}` as "freq1")} />
                        <input className="h-8 px-2 text-xs border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Days" {...caseForm.register(`dur${i}` as "dur1")} />
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-400">Drug · Dose (e.g. 500mg) · Frequency (e.g. BD) · Duration (e.g. 5 days)</p>
                  </div>
                </Card>

                {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
                <div className="flex gap-2">
                  <Button variant="outline" type="button" onClick={() => setStep(isNewPatient ? "new-patient" : "confirm-patient")}>Back</Button>
                  <Button type="submit" loading={loading} className="flex-1">Save Case</Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Step 4: Done ──────────────────────────────────────────────── */}
          {step === "done" && caseResult && (
            <Card className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">Case Saved</h2>
              <p className="text-sm text-gray-500 mb-6">
                Case record created for <span className="font-semibold text-gray-800">{caseResult.patient_name}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => router.push("/patients")}>
                  <Users className="h-4 w-4" /> View Patients
                </Button>
                <Button onClick={() => {
                  // Reset all state for a new case
                  setStep("lookup");
                  setError("");
                  setMatches([]);
                  setSelectedPatient(null);
                  setIsNewPatient(false);
                  setCaseResult(null);
                  lookupForm.reset();
                  newPatientForm.reset();
                  caseForm.reset();
                }}>
                  <FilePlus className="h-4 w-4" /> New Case
                </Button>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// Missing import added inline
function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FilePlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}
