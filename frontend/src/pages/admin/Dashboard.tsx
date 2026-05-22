import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Receipt, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { PageHeader } from "@/components/PageHeader";
import { Stat } from "@/components/Stat";
import { api } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EventDoc, OrderDoc } from "@/lib/types";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "attendee" | "organizer" | "admin";
  createdAt: string;
}

const orderVariant: Record<OrderDoc["orderStatus"], "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<AdminUser[]>("/api/users"),
      api<EventDoc[]>("/api/events"),
      api<OrderDoc[]>("/api/orders"),
    ])
      .then(([u, e, o]) => {
        setUsers(u);
        setEvents(e);
        setOrders(o);
      })
      .catch((err) => setError(err.message));
  }, []);

  const totalRevenue = useMemo(
    () => (orders || []).filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + Number(o.totalAmount), 0),
    [orders],
  );
  const orgCount = useMemo(() => (users || []).filter((u) => u.role === "organizer").length, [users]);
  const publishedCount = useMemo(() => (events || []).filter((e) => e.status === "published").length, [events]);

  const loading = !users || !events || !orders;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Platform overview"
        description="Cross-org view of users, events, and orders."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/orders">All orders</Link>
          </Button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Stat
              label="Users"
              value={users.length}
              icon={Users}
              delta={{ value: `${orgCount} organizers` }}
            />
            <Stat
              label="Events"
              value={events.length}
              icon={CalendarRange}
              delta={{ value: `${publishedCount} published` }}
            />
            <Stat label="Orders" value={orders.length} icon={Receipt} />
            <Stat label="Revenue" value={formatMoney(totalRevenue)} icon={Wallet} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent orders</CardTitle>
                <CardDescription>Latest 8 across all events.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/orders">Manage</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="divide-y">
                {orders.slice(0, 8).map((o) => {
                  const eventTitle = typeof o.event === "string" ? o.event : o.event?.title;
                  const userLabel = typeof o.user === "string" ? o.user : o.user?.name || o.user?.email;
                  return (
                    <div key={o._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{eventTitle}</p>
                        <p className="text-xs text-muted-foreground">{userLabel} · {formatDate(o.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={orderVariant[o.orderStatus]} className="capitalize">{o.orderStatus}</Badge>
                        <span className="tabular-nums font-medium">{formatMoney(o.totalAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newest users</CardTitle>
            <CardDescription>Last 6 signups.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3 text-sm">
                {users.slice(0, 6).map((u) => (
                  <li key={u._id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
