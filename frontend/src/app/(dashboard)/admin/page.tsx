"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";
import { adminApi } from "@/lib/api";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { extractApiError, formatDate } from "@/lib/utils";
import {
  ShieldCheck, Users, SlidersHorizontal, UserPlus, Check, X as XIcon,
  Power, PowerOff, RefreshCcw, AlertCircle,
} from "lucide-react";

// ── Module toggle row ─────────────────────────────────────────────────────────
function ModuleToggle({
  label, description, enabled, onChange, saving,
}: {
  label: string; description: string; enabled: boolean;
  onChange: (v: boolean) => void; saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? "bg-primary" : "bg-gray-300"} ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

// ── Add doctor modal ──────────────────────────────────────────────────────────
function AddDoctorModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", password: "",
    specialty: "", clinic_name: "", is_admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminApi.createDoctor(form);
      onSuccess();
      onClose();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Add New Doctor
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
            <Input label="Last Name *" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
          </div>
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Password *" type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Input label="Specialty" placeholder="General Medicine" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
          <Input label="Clinic Name" value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_admin} onChange={(e) => setForm({ ...form, is_admin: e.target.checked })} className="rounded" />
            <span>Grant Admin privileges</span>
          </label>
          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">{error}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1">Create Doctor</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const { doctor } = useAuthStore();
  const { modules, setModules } = useSettingsStore();
  const qc = useQueryClient();
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Redirect if not admin
  if (doctor && !doctor.is_admin) {
    router.replace("/dashboard");
    return null;
  }

  // ── Doctors list ────────────────────────────────────────────────────────────
  const { data: doctors, refetch: refetchDoctors } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: adminApi.listDoctors,
    enabled: !!doctor?.is_admin,
  });

  // ── Settings from server ────────────────────────────────────────────────────
  const { data: serverSettings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: adminApi.getSettings,
    enabled: !!doctor?.is_admin,
    onSuccess: (res: { settings: Record<string, string> }) => setModules(res.settings),
  } as Parameters<typeof useQuery>[0]);

  // ── Toggle module ───────────────────────────────────────────────────────────
  const handleModuleToggle = async (key: string, value: boolean) => {
    setSavingSettings(true);
    setSettingsError("");
    setSettingsSaved(false);
    try {
      const res = await adminApi.updateSettings({ [key]: String(value) });
      setModules(res.settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      setSettingsError(extractApiError(e));
    } finally {
      setSavingSettings(false);
    }
  };

  // ── Toggle doctor active ────────────────────────────────────────────────────
  const toggleDoctor = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      adminApi.updateDoctor(id, { is_active }),
    onSuccess: () => refetchDoctors(),
  });

  const MODULES = [
    { key: "module_appointments", label: "Appointments Module", description: "Allow doctors to view and manage appointment scheduling." },
    { key: "module_inventory",    label: "Inventory Module",    description: "Allow doctors to manage medical inventory and stock." },
    { key: "module_records",      label: "Medical Records",     description: "Allow doctors to create standalone medical records." },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="Admin Console"
        subtitle="Site settings and doctor management"
        actions={
          <Button size="sm" onClick={() => setShowAddDoctor(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Add Doctor
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* Module Settings */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Module Visibility
            </CardTitle>
            {settingsSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Toggle which modules are visible to doctors in their sidebar navigation.
          </p>
          {settingsError && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {settingsError}
            </div>
          )}
          {MODULES.map(({ key, label, description }) => (
            <ModuleToggle
              key={key}
              label={label}
              description={description}
              enabled={modules[key] !== false}
              onChange={(v) => handleModuleToggle(key, v)}
              saving={savingSettings}
            />
          ))}
        </Card>

        {/* Doctor Management */}
        <Card padding="none">
          <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Doctor Accounts ({doctors?.length ?? 0})
            </CardTitle>
            <button
              onClick={() => refetchDoctors()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-border">
            {(doctors ?? []).map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {doc.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.full_name}</p>
                    {doc.is_admin && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ADMIN</span>
                    )}
                    {!doc.is_active && (
                      <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">INACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {doc.email} {doc.specialty && `· ${doc.specialty}`}
                  </p>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                  {formatDate(doc.created_at)}
                </div>
                {doc.id !== doctor?.id && (
                  <button
                    onClick={() => toggleDoctor.mutate({ id: doc.id, is_active: !doc.is_active })}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${doc.is_active ? "text-gray-400 hover:text-red-500 hover:bg-red-50" : "text-gray-400 hover:text-green-500 hover:bg-green-50"}`}
                    title={doc.is_active ? "Deactivate" : "Activate"}
                  >
                    {doc.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))}
            {(doctors ?? []).length === 0 && (
              <div className="py-12 text-center">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No doctor accounts yet.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Admin credentials reminder */}
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Admin Account</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Default credentials: <code className="font-mono bg-amber-100 px-1 rounded">admin@nalabase.com</code>{" "}
                / <code className="font-mono bg-amber-100 px-1 rounded">Admin@NalaBase1</code>.
                Change this password from Settings after first login.
              </p>
            </div>
          </div>
        </Card>

      </div>

      {showAddDoctor && (
        <AddDoctorModal
          onClose={() => setShowAddDoctor(false)}
          onSuccess={() => { refetchDoctors(); qc.invalidateQueries({ queryKey: ["admin-doctors"] }); }}
        />
      )}
    </div>
  );
}
