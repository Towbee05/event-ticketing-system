import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Ticket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatMoney, cn } from "@/lib/utils";
import type { EventDoc, TicketDoc } from "@/lib/types";

type TicketType = "early-bird" | "regular" | "vip-ticket";

interface NewTicket {
  ticketType: TicketType;
  price: string;
  quantity: string;
  salesStartDate: string;
  salesEndDate: string;
}

const emptyTicket: NewTicket = {
  ticketType: "regular",
  price: "",
  quantity: "",
  salesStartDate: "",
  salesEndDate: "",
};

const ticketTypeLabel: Record<TicketType, string> = {
  "early-bird": "Early bird",
  regular: "Regular",
  "vip-ticket": "VIP",
};

export default function TicketsManager() {
  const { id: eventId } = useParams<{ id: string }>();
  const toast = useToast();
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [tickets, setTickets] = useState<TicketDoc[] | null>(null);
  const [form, setForm] = useState<NewTicket>(emptyTicket);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!eventId) return;
    Promise.all([
      api<EventDoc>(`/api/events/${eventId}`),
      api<TicketDoc[]>(`/api/tickets/event/${eventId}`),
    ])
      .then(([e, t]) => {
        setEvent(e);
        setTickets(t);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(load, [eventId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api("/api/tickets", {
        method: "POST",
        body: {
          event: eventId,
          ticketType: form.ticketType,
          price: Number(form.price),
          quantity: Number(form.quantity),
          salesStartDate: form.salesStartDate
            ? new Date(form.salesStartDate).toISOString()
            : undefined,
          salesEndDate: new Date(form.salesEndDate).toISOString(),
        },
      });
      toast.success("Ticket type added");
      setForm(emptyTicket);
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      setError(msg);
      toast.error("Couldn't add ticket type", msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this ticket type?")) return;
    try {
      await api(`/api/tickets/${id}`, { method: "DELETE" });
      toast.success("Ticket type deleted");
      load();
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : undefined);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to events
        </Link>
      </div>

      <PageHeader
        eyebrow={event ? formatDate(event.date) : "—"}
        title={event ? `Tickets · ${event.title}` : "Tickets"}
        description="Define types, prices, and sales windows. Sold counts update as orders come in."
        actions={
          event ? (
            <Button variant="outline" asChild>
              <Link to={`/events/${event._id}`}>Preview event</Link>
            </Button>
          ) : undefined
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Existing types
          </h2>
          {!tickets ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No tickets yet"
              description="Add a ticket type on the right to start selling."
            />
          ) : (
            tickets.map((t) => {
              const sellRatio = t.quantity > 0 ? (t.sold / t.quantity) * 100 : 0;
              return (
                <Card key={t._id}>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{ticketTypeLabel[t.ticketType as TicketType] || t.ticketType}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatMoney(t.price)} · sales close {formatDate(t.salesEndDate)}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => remove(t._id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {t.sold} of {t.quantity} sold
                        </span>
                        <span className="font-medium">{Math.round(sellRatio)}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full transition-all", sellRatio > 80 ? "bg-warning" : "bg-primary")}
                          style={{ width: `${sellRatio}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" /> Add a ticket type
            </CardTitle>
            <CardDescription>Price, capacity, and when sales close.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.ticketType}
                  onValueChange={(v) => setForm((p) => ({ ...p, ticketType: v as TicketType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="early-bird">Early bird</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vip-ticket">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Sales start (optional)</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={form.salesStartDate}
                  onChange={(e) => setForm((p) => ({ ...p, salesStartDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endsAt">Sales end</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  required
                  value={form.salesEndDate}
                  onChange={(e) => setForm((p) => ({ ...p, salesEndDate: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Adding…" : "Add ticket type"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
