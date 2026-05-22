import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import type { Role, User } from "@/lib/auth";

type Mode = "login" | "register";

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: Role };
}

export default function Login() {
  const { setSession } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<Role, "admin">>("attendee");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password, role };
      const data = await api<AuthResponse>(path, { method: "POST", body, skipAuth: true });
      const u: User = {
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
      };
      setSession(data.token, u);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      const dest = (location.state as { from?: string } | null)?.from || "/events";
      navigate(dest, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const item of e.errors) fe[item.field] = item.message;
        setFieldErrors(fe);
      }
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
          <div className="mb-6 grid grid-cols-2 rounded-lg border bg-muted/50 p-1 text-sm">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  mode === m
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in with your email and password."
              : "Admins are assigned by an existing admin from the dashboard."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label>I want to</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Exclude<Role, "admin">)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendee">Attend events</SelectItem>
                    <SelectItem value="organizer">Organize events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
    </AuthShell>
  );
}
