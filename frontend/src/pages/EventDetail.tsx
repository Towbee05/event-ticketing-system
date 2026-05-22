import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Calendar, MapPin, Minus, Plus, ShieldCheck, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { EventDoc, OrderDoc, PaymentInitResponse, TicketDoc } from "@/lib/types";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [tickets, setTickets] = useState<TicketDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api<EventDoc>(`/api/events/${id}`), api<TicketDoc[]>(`/api/tickets/event/${id}`)])
      .then(([e, t]) => {
        setEvent(e);
        setTickets(t);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const cart = useMemo(
    () =>
      Object.entries(qty)
        .filter(([, q]) => q > 0)
        .map(([ticket, quantity]) => ({ ticket, quantity })),
    [qty],
  );

  const total = useMemo(() => {
    if (!tickets) return 0;
    return cart.reduce((sum, line) => {
      const t = tickets.find((x) => x._id === line.ticket);
      if (!t) return sum;
      const price = typeof t.price === "number" ? t.price : parseFloat(String(t.price));
      return sum + price * line.quantity;
    }, 0);
  }, [cart, tickets]);

  function adjust(ticketId: string, delta: number, max: number) {
    setQty((prev) => {
      const next = Math.max(0, Math.min(max, (prev[ticketId] || 0) + delta));
      return { ...prev, [ticketId]: next };
    });
  }

  async function checkout() {
    if (!event || cart.length === 0) return;
    if (!user) {
      navigate("/login", { state: { from: `/events/${event._id}` } });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1) Reserve seats by creating the order.
      const order = await api<OrderDoc>("/api/orders", {
        method: "POST",
        body: { event: event._id, items: cart },
      });
      toast.success("Order reserved", "Redirecting to payment…");

      // 2) Initialise payment — dev mode returns a URL back to /payment/callback,
      //    real mode returns the Paystack hosted checkout URL.
      const init = await api<PaymentInitResponse>("/api/payments/initialize", {
        method: "POST",
        body: { orderId: order._id },
      });

      // Persist orderId so the callback page knows what to show after verify.
      sessionStorage.setItem(`etb.payment.${init.reference}`, order._id);

      // 3) Redirect (full navigation — Paystack would do this in production).
      window.location.assign(init.authorizationUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed";
      setError(msg);
      toast.error("Checkout failed", msg);
      setSubmitting(false);
    }
  }

  if (error && !event) return <Alert variant="error">{error}</Alert>;
  if (!event || !tickets) {
    return (
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-8">
        <div className="overflow-hidden rounded-2xl border bg-card">
          {event.bannerImage ? (
            <img
              src={event.bannerImage}
              alt={event.title}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-accent via-secondary to-primary/15">
              <Ticket className="h-12 w-12 text-primary/40" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {event.category && <Badge variant="secondary" className="capitalize">{event.category}</Badge>}
            <Badge variant={event.status === "published" ? "default" : event.status === "cancelled" ? "destructive" : "outline"} className="capitalize">
              {event.status}
            </Badge>
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{event.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> {formatDate(event.date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {event.venue}
            </span>
          </div>
          <p className="text-balance leading-relaxed text-foreground/90">{event.description}</p>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Tickets</h2>
          {tickets.length === 0 ? (
            <Alert>No tickets available for this event yet.</Alert>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => {
                const available = Math.max(0, t.quantity - t.sold);
                const now = new Date();
                const onSale =
                  new Date(t.salesStartDate) <= now && new Date(t.salesEndDate) >= now;
                const soldOut = available === 0;
                const disabled = soldOut || !onSale;
                const value = qty[t._id] || 0;
                const fillPct = Math.min(100, (t.sold / t.quantity) * 100);
                return (
                  <div
                    key={t._id}
                    className={cn(
                      "rounded-2xl border bg-card p-4 transition",
                      disabled ? "opacity-70" : "hover:border-primary/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {t.ticketType?.replace("-", " ") || "Ticket"}
                          </span>
                          {soldOut && <Badge variant="destructive">Sold out</Badge>}
                          {!soldOut && !onSale && <Badge variant="outline">Sales closed</Badge>}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {formatMoney(t.price)} · {available} left of {t.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => adjust(t._id, -1, available)}
                          disabled={disabled || value === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-7 text-center text-sm font-semibold">{value}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => adjust(t._id, +1, available)}
                          disabled={disabled || value >= available}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full transition-all",
                          fillPct > 80 ? "bg-warning" : "bg-primary",
                        )}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <aside>
        <Card className="sticky top-20">
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
            <CardDescription>Seats are reserved the moment you place the order.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pick tickets to see your total.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {cart.map((line) => {
                  const t = tickets.find((x) => x._id === line.ticket);
                  if (!t) return null;
                  return (
                    <div key={line.ticket} className="flex justify-between">
                      <span className="capitalize">
                        {t.ticketType?.replace("-", " ") || "Ticket"} × {line.quantity}
                      </span>
                      <span className="tabular-nums">{formatMoney(Number(t.price) * line.quantity)}</span>
                    </div>
                  );
                })}
                <div className="mt-3 flex justify-between border-t pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(total)}</span>
                </div>
              </div>
            )}
            {error && <Alert variant="error">{error}</Alert>}
            <Button className="w-full" size="lg" disabled={cart.length === 0 || submitting} onClick={checkout}>
              {submitting ? "Placing order…" : user ? "Place order" : "Sign in to book"}
            </Button>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
              Inventory check is atomic — overselling can't happen, and the reservation rolls back if anything fails.
            </div>
            {user && (
              <p className="text-center text-xs text-muted-foreground">
                Already booked?{" "}
                <Link to="/my-orders" className="text-primary hover:underline">
                  View your orders
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
