import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatMoney } from "@/lib/utils";
import type { OrderDoc } from "@/lib/types";

const STATUSES = ["all", "pending", "completed", "cancelled"] as const;
type StatusFilter = (typeof STATUSES)[number];

const orderVariant: Record<OrderDoc["orderStatus"], "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

export default function AllOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setOrders(null);
    api<OrderDoc[]>("/api/orders", { query: { status: status === "all" ? undefined : status } })
      .then(setOrders)
      .catch((e) => setError(e.message));
  }

  useEffect(load, [status]);

  async function complete(id: string) {
    setBusyId(id);
    try {
      await api(`/api/orders/${id}/complete`, { method: "PATCH" });
      toast.success("Order marked completed");
      load();
    } catch (e) {
      toast.error("Complete failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await api(`/api/orders/${id}`, { method: "DELETE" });
      toast.success("Order deleted");
      load();
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : undefined);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="All orders"
        description="Cross-organizer view. Filter, complete, or delete orders."
        actions={
          <div className="w-44">
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s === "all" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!orders ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No orders match this filter"
          description="Try a different status."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const eventTitle = typeof o.event === "string" ? o.event : o.event?.title;
            const userLabel = typeof o.user === "string" ? o.user : o.user?.name || o.user?.email;
            return (
              <Card key={o._id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{eventTitle}</CardTitle>
                      <CardDescription className="text-xs">
                        {userLabel} · {formatDate(o.createdAt)} · #{o._id.slice(-6)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={orderVariant[o.orderStatus]} className="capitalize">{o.orderStatus}</Badge>
                      <Badge variant="outline" className="capitalize">{o.paymentStatus}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-sm font-semibold tabular-nums">{formatMoney(o.totalAmount)}</div>
                  <div className="flex gap-2">
                    {o.orderStatus === "pending" && (
                      <Button size="sm" onClick={() => complete(o._id)} disabled={busyId === o._id}>
                        Mark completed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove(o._id)}
                      disabled={busyId === o._id}
                    >
                      Delete
                    </Button>
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
