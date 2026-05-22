import { useRef, useState } from "react";
import { CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/Alert";
import { PageHeader } from "@/components/PageHeader";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/utils";
import type { IssuedTicketDoc } from "@/lib/types";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "valid"; ticket: IssuedTicketDoc }
  | { kind: "error"; message: string; code?: string };

export default function TicketScanner() {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function validate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setResult({ kind: "loading" });
    try {
      const ticket = await api<IssuedTicketDoc>("/api/tickets/validate", {
        method: "POST",
        body: { code: trimmed },
      });
      setResult({ kind: "valid", ticket });
      toast.success("Ticket valid", "Mark them in.");
    } catch (e) {
      if (e instanceof ApiError) {
        setResult({ kind: "error", message: e.message, code: e.code });
        toast.error(e.code === "TICKET_ALREADY_USED" ? "Already used" : "Invalid ticket", e.message);
      } else {
        setResult({ kind: "error", message: "Validation failed" });
      }
    } finally {
      setCode("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Organizer"
        title="Validate tickets"
        description="Type or paste a code from the attendee's QR. Hardware scanners that type the code + Enter work too."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4" /> Scan a ticket
          </CardTitle>
          <CardDescription>12-character code, hyphens optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={validate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Ticket code</Label>
              <Input
                id="code"
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="36A24F562880"
                className="font-mono tracking-widest"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={result.kind === "loading"}>
              {result.kind === "loading" ? "Checking…" : "Validate"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result.kind === "valid" && <ValidResult ticket={result.ticket} />}
      {result.kind === "error" && (
        <Alert variant="error">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{result.message}</p>
              {result.code && (
                <p className="mt-0.5 text-xs opacity-80">Code: {result.code}</p>
              )}
            </div>
          </div>
        </Alert>
      )}
    </div>
  );
}

function ValidResult({ ticket }: { ticket: IssuedTicketDoc }) {
  const ev =
    ticket.event && typeof ticket.event === "object" ? ticket.event : null;
  const holder =
    ticket.holder && typeof ticket.holder === "object" ? ticket.holder : null;
  const type =
    ticket.ticketType && typeof ticket.ticketType === "object" ? ticket.ticketType.ticketType : null;

  return (
    <Card className="border-success/40 bg-success/5">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-semibold text-success">Valid — admitted</p>
            <p className="text-sm text-muted-foreground">
              Marked used at {formatDate(ticket.usedAt || new Date().toISOString())}
            </p>
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border bg-card p-4 text-sm">
          {ev && (
            <Row label="Event" value={ev.title} />
          )}
          {holder && (
            <Row label="Holder" value={`${holder.name || "—"} · ${holder.email || ""}`} />
          )}
          {type && <Row label="Ticket type" value={type.replace("-", " ")} />}
          <Row label="Code" value={<span className="font-mono">{ticket.code}</span>} />
          <Badge variant="secondary" className="mt-1 w-fit capitalize">{ticket.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}
