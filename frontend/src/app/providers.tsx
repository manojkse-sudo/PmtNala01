"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useSettingsStore } from "@/store/settings";
import { adminApi } from "@/lib/api";

function SettingsLoader() {
  const { isAuthenticated } = useAuthStore();
  const { setModules, loaded } = useSettingsStore();

  useEffect(() => {
    if (isAuthenticated && !loaded) {
      adminApi.getSettings()
        .then((res) => setModules(res.settings))
        .catch(() => {/* silently ignore — defaults stay in store */});
    }
  }, [isAuthenticated, loaded, setModules]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount, error: unknown) => {
              if (error && typeof error === "object" && "response" in error) {
                const e = error as { response?: { status?: number } };
                if (e.response?.status === 401 || e.response?.status === 403) return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsLoader />
      {children}
    </QueryClientProvider>
  );
}
