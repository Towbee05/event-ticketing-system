import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { OrderDoc, PaymentInitResponse } from "@/lib/types";

const statusVariant: Record<OrderDoc["orderStatus"], "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

export default function MyOrders() {
  const toast = useToast();
  const location = useLocation();
  const highlightId = location.hash.replace(/^#/, "") || null;
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api<OrderDoc[]>("/api/orders/my-orders")
      .then(setOrders)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/cancel`, { method: "PATCH" });
      toast.success("Order cancelled", "Your seats have been released.");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Cancel failed";
      toast.error("Cancel failed", msg);
    } finally {
      setBusyId(null);
    }
  }

  async function pay(id: string) {
    setBusyId(id);
    try {
      const init = await api<PaymentInitResponse>("/api/payments/initialize", {
        method: "POST",
        body: { orderId: id },
      });
      sessionStorage.setItem(`etb.payment.${init.reference}`, id);
      window.location.assign(init.authorizationUrl);
    } catch (e) {
      toast.error("Couldn't start payment", e instanceof Error ? e.message : undefined);
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bookings"
        title="My orders"
        description="Every ticket you've purchased lives here. Cancel pending orders to free your reservation."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!orders ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No orders yet"
          description="When you book tickets they'll show up here."
          action={
            <Button asChild>
              <Link to="/events">Browse events</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const eventTitle = typeof o.event === "string" ? o.event : o.event?.title;
            const highlighted = highlightId === o._id;
            return (
              <Card
                key={o._id}
                className={cn(
                  "transition-all",
                  highlighted ? "ring-2 ring-primary/40" : undefined,
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{eventTitle}</CardTitle>
                      <CardDescription className="text-xs">
                        Placed {formatDate(o.createdAt)} · Order #{o._id.slice(-6)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[o.orderStatus]} className="capitalize">{o.orderStatus}</Badge>
                      <Badge variant="outline" className="capitalize">{o.paymentStatus}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm font-semibold tabular-nums">{formatMoney(o.totalAmount)}</div>
                  <div className="flex gap-2">
                    {o.orderStatus === "completed" && o.paymentStatus === "paid" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/my-tickets">View tickets</Link>
                      </Button>
                    )}
                    {o.orderStatus === "pending" && (
                      <>
                        {o.paymentStatus !== "paid" && (
                          <Button size="sm" onClick={() => pay(o._id)} disabled={busyId === o._id}>
                            {busyId === o._id ? "Loading…" : "Pay now"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancel(o._id)}
                          disabled={busyId === o._id}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
