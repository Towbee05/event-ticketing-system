import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, MapPin, Ticket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { EventDoc, IssuedTicketDoc } from "@/lib/types";

interface Grouped {
  event: EventDoc;
  tickets: IssuedTicketDoc[];
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<IssuedTicketDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<IssuedTicketDoc[]>("/api/tickets/mine")
      .then(setTickets)
      .catch((e) => setError(e.message));
  }, []);

  const groups = useMemo<Grouped[]>(() => {
    if (!tickets) return [];
    const byEvent = new Map<string, Grouped>();
    for (const t of tickets) {
      const ev = (typeof t.event === "string" ? null : t.event) as EventDoc | null;
      if (!ev) continue;
      const key = ev._id;
      if (!byEvent.has(key)) byEvent.set(key, { event: ev, tickets: [] });
      byEvent.get(key)!.tickets.push(t);
    }
    return Array.from(byEvent.values()).sort(
      (a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime(),
    );
  }, [tickets]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Wallet"
        title="My tickets"
        description="Show these QR codes at the door. Each code is single-use."
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!tickets ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Tickets appear here once payment is confirmed."
          action={
            <Button asChild>
              <Link to="/events">Browse events</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.event._id} className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">{g.event.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="mr-1 inline-block h-3.5 w-3.5" />
                    {formatDate(g.event.date)}
                    <span className="mx-2">·</span>
                    <MapPin className="mr-1 inline-block h-3.5 w-3.5" />
                    {g.event.venue}
                  </p>
                </div>
                <Badge variant="secondary">
                  {g.tickets.length} {g.tickets.length === 1 ? "ticket" : "tickets"}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.tickets.map((t) => (
                  <TicketCard key={t._id} ticket={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket }: { ticket: IssuedTicketDoc }) {
  const used = ticket.status === "used";
  const cancelled = ticket.status === "cancelled";
  const type =
    ticket.ticketType && typeof ticket.ticketType === "object" ? ticket.ticketType.ticketType : null;

  return (
    <Card className={cn("overflow-hidden", used && "opacity-70")}>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <Badge variant={cancelled ? "destructive" : used ? "secondary" : "default"} className="capitalize">
            {ticket.status}
          </Badge>
          {type && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {type.replace("-", " ")}
            </span>
          )}
        </div>
        <div className="relative flex items-center justify-center rounded-lg bg-white p-4">
          <QRCodeSVG value={ticket.code} size={160} level="M" />
          {used && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center text-center text-success">
                <CheckCircle2 className="h-8 w-8" />
                <span className="mt-1 text-sm font-semibold">Used</span>
                {ticket.usedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(ticket.usedAt)}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-center font-mono text-sm tracking-widest">{ticket.code}</div>
      </CardContent>
    </Card>
  );
}
