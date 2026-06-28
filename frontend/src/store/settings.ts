import { create } from "zustand";

interface SettingsState {
  modules: Record<string, boolean>;
  loaded: boolean;
  setModules: (settings: Record<string, string>) => void;
}

function parseBool(v: string): boolean {
  return v === "true" || v === "1";
}

export const useSettingsStore = create<SettingsState>((set) => ({
  modules: {
    module_appointments: true,
    module_inventory: true,
    module_records: true,
  },
  loaded: false,

  setModules: (settings) => {
    const modules: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(settings)) {
      modules[key] = parseBool(value);
    }
    set({ modules, loaded: true });
  },
}));
