import type { ReactNode } from "react";
import { ShieldCheck, Sparkles, Ticket, TrendingUp } from "lucide-react";

const FEATURES = [
  {
    icon: Ticket,
    title: "Atomic inventory",
    description: "Overselling is impossible — reservations roll back if anything fails.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    description: "JWT auth, bcrypt password hashing, and role-aware endpoints throughout.",
  },
  {
    icon: TrendingUp,
    title: "Built for organizers",
    description: "Sell early-bird, regular, and VIP tickets with realtime sold counts.",
  },
];

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="-mx-4 -my-8 grid min-h-[calc(100vh-3.5rem-3rem)] sm:-mx-0 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-hero p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Event Ticketing System
          </div>
          <h2 className="mt-6 text-balance text-3xl font-semibold tracking-tight">
            Sell tickets, fill seats, and never oversell again.
          </h2>
          <p className="mt-3 max-w-md text-balance text-sm text-muted-foreground">
            One backend for events, tickets, orders, payments, and notifications — wired together with role-aware auth.
          </p>
        </div>
        <div className="relative space-y-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card shadow-sm">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
