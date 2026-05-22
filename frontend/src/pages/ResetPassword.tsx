import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { Role, User } from "@/lib/auth";

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string; role: Role };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api<AuthResponse>("/api/auth/reset-password", {
        method: "POST",
        body: { token, password },
        skipAuth: true,
      });
      const u: User = {
        id: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
      };
      setSession(data.token, u);
      toast.success("Password reset", "You're signed in with the new password.");
      navigate("/events", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reset failed";
      setError(msg);
      toast.error("Reset failed", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The reset token expires 30 minutes after it was issued.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" required value={token} onChange={(e) => setToken(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
