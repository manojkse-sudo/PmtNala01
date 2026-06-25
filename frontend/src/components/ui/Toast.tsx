"use client";
import { useUIStore } from "@/store/ui";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />,
  error: <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />,
};

const borderMap = {
  success: "border-l-green-500",
  error: "border-l-red-500",
  info: "border-l-blue-500",
  warning: "border-l-amber-500",
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 bg-white rounded-lg border border-border shadow-lg",
            "border-l-4 px-4 py-3 animate-slide-up",
            borderMap[toast.type]
          )}
        >
          {iconMap[toast.type]}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
