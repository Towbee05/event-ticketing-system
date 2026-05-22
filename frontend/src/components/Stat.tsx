import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  delta?: { value: string; positive?: boolean };
  className?: string;
}

export function Stat({ label, value, icon: Icon, delta, className }: StatProps) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      {delta && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            delta.positive ? "text-success" : "text-muted-foreground",
          )}
        >
          {delta.value}
        </p>
      )}
    </div>
  );
}
