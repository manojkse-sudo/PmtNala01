import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Doctor } from "@/types";

interface AuthState {
  doctor: Doctor | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (doctor: Doctor, accessToken: string, refreshToken: string) => void;
  updateDoctor: (doctor: Doctor) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      doctor: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (doctor, accessToken, refreshToken) => {
        // Also write to localStorage for axios interceptor
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
        }
        set({ doctor, accessToken, refreshToken, isAuthenticated: true });
      },

      updateDoctor: (doctor) => set({ doctor }),

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
        set({ doctor: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "nalabase-auth",
      partialize: (state) => ({
        doctor: state.doctor,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
