import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { EventDoc } from "@/lib/types";

const statusVariant: Record<EventDoc["status"], "default" | "secondary" | "destructive"> = {
  published: "default",
  draft: "secondary",
  cancelled: "destructive",
};

export default function MyEvents() {
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<EventDoc[]>("/api/events", { query: { mine: "true" } })
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organizer"
        title="Your events"
        description="Drafts and published events you organize."
        actions={
          <Button asChild>
            <Link to="/organizer/events/new">
              <Plus className="h-4 w-4" /> New event
            </Link>
          </Button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      {!events ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No events yet"
          description="Create your first event and start selling tickets in minutes."
          action={
            <Button asChild>
              <Link to="/organizer/events/new">
                <Plus className="h-4 w-4" /> New event
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <Card key={event._id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{event.title}</CardTitle>
                    <CardDescription>
                      {formatDate(event.date)} · {event.venue}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant[event.status]} className="capitalize">
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/organizer/events/${event._id}/edit`}>Edit</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/organizer/events/${event._id}/tickets`}>Manage tickets</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to={`/events/${event._id}`}>Preview</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
