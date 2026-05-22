import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: unknown) {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? 0));
  if (Number.isNaN(n)) return "₦0";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function formatDate(value: string | Date | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
