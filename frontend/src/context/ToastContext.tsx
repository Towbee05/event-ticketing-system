import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (input: {
    message: string;
    description?: string;
    variant?: ToastVariant;
    duration?: number;
  }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({
      message,
      description,
      variant = "info",
      duration = 4000,
    }: {
      message: string;
      description?: string;
      variant?: ToastVariant;
      duration?: number;
    }) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, description, variant, duration }]);
    },
    [],
  );

  const api = useMemo<ToastContextValue>(
    () => ({
      toast: push,
      success: (message, description) => push({ message, description, variant: "success" }),
      error: (message, description) => push({ message, description, variant: "error", duration: 6000 }),
      info: (message, description) => push({ message, description, variant: "info" }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={remove} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:top-auto sm:items-end sm:px-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

const variantStyles: Record<ToastVariant, { container: string; iconBg: string; icon: typeof Info }> = {
  success: {
    container: "border-success/30 bg-card",
    iconBg: "bg-success/15 text-success",
    icon: CheckCircle2,
  },
  error: {
    container: "border-destructive/40 bg-card",
    iconBg: "bg-destructive/15 text-destructive",
    icon: AlertCircle,
  },
  info: {
    container: "border-border bg-card",
    iconBg: "bg-accent text-accent-foreground",
    icon: Info,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);

  const v = variantStyles[toast.variant];
  const Icon = v.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3 shadow-lg animate-toast-in",
        v.container,
      )}
    >
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", v.iconBg)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium leading-tight">{toast.message}</p>
        {toast.description && (
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
