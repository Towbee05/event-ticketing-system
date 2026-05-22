import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Plus, Ticket, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Stat } from "@/components/Stat";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EventDoc, OrderDoc, TicketDoc } from "@/lib/types";

const statusVariant: Record<EventDoc["status"], "default" | "secondary" | "destructive"> = {
  published: "default",
  draft: "secondary",
  cancelled: "destructive",
};

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [tickets, setTickets] = useState<TicketDoc[] | null>(null);
  const [orders, setOrders] = useState<OrderDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api<EventDoc[]>("/api/events", { query: { mine: "true" } }),
      api<TicketDoc[]>("/api/tickets"),
      // Admins can see all orders; organizers fall back to their own.
      user.role === "admin"
        ? api<OrderDoc[]>("/api/orders")
        : api<OrderDoc[]>("/api/orders/my-orders"),
    ])
      .then(([e, t, o]) => {
        setEvents(e);
        setTickets(t);
        setOrders(o);
      })
      .catch((err) => setError(err.message));
  }, [user]);

  const mineEvents = events || [];
  const eventIds = useMemo(() => new Set(mineEvents.map((e) => e._id)), [mineEvents]);

  const myTickets = useMemo(
    () => (tickets || []).filter((t) => eventIds.has(typeof t.event === "string" ? t.event : t.event?._id || "")),
    [tickets, eventIds],
  );

  const myOrders = useMemo(
    () =>
      (orders || []).filter((o) =>
        eventIds.has(typeof o.event === "string" ? o.event : o.event?._id || ""),
      ),
    [orders, eventIds],
  );

  const ticketsSold = myTickets.reduce((sum, t) => sum + t.sold, 0);
  const totalCapacity = myTickets.reduce((sum, t) => sum + t.quantity, 0);
  const revenue = myOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const pending = myOrders.filter((o) => o.orderStatus === "pending").length;

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return [...mineEvents]
      .filter((e) => new Date(e.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [mineEvents]);

  const loading = !events || !tickets || !orders;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Organizer"
        title="Dashboard"
        description="A quick view of how your events are performing."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/organizer/events">All events</Link>
            </Button>
            <Button asChild>
              <Link to="/organizer/events/new">
                <Plus className="h-4 w-4" /> New event
              </Link>
            </Button>
          </>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <Stat label="Events" value={mineEvents.length} icon={CalendarRange} />
            <Stat
              label="Tickets sold"
              value={ticketsSold}
              icon={Ticket}
              delta={
                totalCapacity > 0
                  ? { value: `${Math.round((ticketsSold / totalCapacity) * 100)}% of capacity` }
                  : undefined
              }
            />
            <Stat label="Revenue (paid)" value={formatMoney(revenue)} icon={Wallet} />
            <Stat
              label="Pending orders"
              value={pending}
              icon={TrendingUp}
              delta={pending > 0 ? { value: "awaiting payment", positive: false } : undefined}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upcoming events</CardTitle>
                <CardDescription>Next 5 events on your calendar.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/organizer/events">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="No upcoming events"
                description="Create your first event to start selling tickets."
                action={
                  <Button asChild>
                    <Link to="/organizer/events/new">
                      <Plus className="h-4 w-4" /> New event
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="divide-y">
                {upcomingEvents.map((e) => (
                  <Link
                    key={e._id}
                    to={`/organizer/events/${e._id}/tickets`}
                    className="flex items-center justify-between gap-4 py-3 transition hover:opacity-80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.venue}</p>
                    </div>
                    <Badge variant={statusVariant[e.status]} className="capitalize">{e.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Last 5 orders on your events.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : myOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {myOrders.slice(0, 5).map((o) => {
                  const eventTitle = typeof o.event === "string" ? o.event : o.event?.title;
                  return (
                    <li key={o._id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{eventTitle}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                      </div>
                      <span className="shrink-0 tabular-nums font-medium">{formatMoney(o.totalAmount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
