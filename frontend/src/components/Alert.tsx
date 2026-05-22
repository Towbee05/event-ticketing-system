import { cn } from "@/lib/utils";

interface AlertProps {
  variant?: "error" | "info" | "success";
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "info", children, className }: AlertProps) {
  const styles = {
    error: "border-destructive/40 bg-destructive/10 text-destructive",
    info: "border-border bg-muted text-foreground",
    success: "border-green-500/40 bg-green-500/10 text-green-700",
  }[variant];
  return (
    <div className={cn("rounded-md border px-4 py-3 text-sm", styles, className)}>{children}</div>
  );
}
