import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatMoney } from "@/lib/utils";
import type { PaymentVerifyResponse } from "@/lib/types";

type State = "verifying" | "success" | "failed" | "error";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const reference = params.get("reference");
  const toast = useToast();
  const [state, setState] = useState<State>("verifying");
  const [result, setResult] = useState<PaymentVerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Strict-mode double-invocation guard.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!reference) {
      setState("error");
      setError("No payment reference in the URL.");
      return;
    }
    api<PaymentVerifyResponse>("/api/payments/verify", {
      method: "POST",
      body: { reference },
    })
      .then((data) => {
        setResult(data);
        if (data.status === "successful") {
          setState("success");
          toast.success("Payment confirmed", "Your tickets are locked in.");
        } else {
          setState("failed");
          toast.error("Payment failed", "Please try again from My Orders.");
        }
      })
      .catch((e) => {
        setState("error");
        setError(e instanceof Error ? e.message : "Verification failed");
        toast.error("Verification failed", e instanceof Error ? e.message : undefined);
      })
      .finally(() => {
        if (reference) sessionStorage.removeItem(`etb.payment.${reference}`);
      });
  }, [reference, toast]);

  const orderId = result?.order?._id;
  const total = result?.order?.totalAmount;

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
            {state === "verifying" && (
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            )}
            {state === "success" && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </span>
            )}
            {(state === "failed" || state === "error") && (
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                <XCircle className="h-7 w-7" />
              </span>
            )}
          </div>
          <CardTitle>
            {state === "verifying" && "Verifying your payment…"}
            {state === "success" && "Payment confirmed"}
            {state === "failed" && "Payment didn't go through"}
            {state === "error" && "Something went wrong"}
          </CardTitle>
          <CardDescription>
            {state === "verifying" && "Hang tight — we're confirming with the payment provider."}
            {state === "success" && "Your seats are locked in. We've emailed a receipt."}
            {state === "failed" && "No charges were made. Try again or pick different tickets."}
            {state === "error" && (error || "We couldn't verify this transaction.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {result?.alreadyVerified && (
            <Badge variant="secondary">Already verified previously</Badge>
          )}
          {orderId && total !== undefined && (
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order</span>
                <span className="font-mono">#{orderId.slice(-6)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="tabular-nums font-semibold">{formatMoney(total)}</span>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild>
              <Link to={orderId ? `/my-orders#${orderId}` : "/my-orders"}>
                {state === "success" ? "View my orders" : "Back to my orders"}
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/events">Browse more events</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
