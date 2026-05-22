import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/Alert";
import { AuthShell } from "@/components/AuthShell";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDevToken(null);
    setSubmitting(true);
    try {
      const data = await api<{ devToken?: string } | undefined>("/api/auth/forgot-password", {
        method: "POST",
        body: { email },
        skipAuth: true,
      });
      setMessage(
        "If an account exists for that email, a reset link has been sent. Check your inbox.",
      );
      if (data?.devToken) setDevToken(data.devToken);
      toast.success("Reset link sent");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
      toast.error("Couldn't send reset link", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we'll send a reset link valid for 30 minutes.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
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
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}
        {devToken && (
          <Alert>
            Dev mode: skip the email and{" "}
            <Link to={`/reset-password?token=${devToken}`} className="underline">
              reset now
            </Link>
            .
          </Alert>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
