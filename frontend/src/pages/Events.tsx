import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Search, Sparkles, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import type { EventDoc } from "@/lib/types";

function EventCard({ event }: { event: EventDoc }) {
  const isCancelled = event.status === "cancelled";
  const isDraft = event.status === "draft";
  return (
    <Link
      to={`/events/${event._id}`}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-accent">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent via-secondary to-primary/15">
            <Ticket className="h-10 w-10 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {event.category && (
            <Badge variant="secondary" className="capitalize backdrop-blur">
              {event.category}
            </Badge>
          )}
          {isDraft && <Badge variant="outline" className="bg-card/80 backdrop-blur">Draft</Badge>}
          {isCancelled && <Badge variant="destructive">Cancelled</Badge>}
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md bg-card/90 px-2 py-1 text-xs font-medium shadow-sm backdrop-blur">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          {formatDate(event.date)}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold">{event.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> {event.venue}
        </div>
      </div>
    </Link>
  );
}

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    api<EventDoc[]>("/api/events")
      .then((data) => setEvents(data.filter((e) => e.status === "published")))
      .catch((e) => setError(e.message));
  }, []);

  const categories = useMemo(() => {
    if (!events) return [];
    return Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[];
  }, [events]);

  const visible = useMemo(() => {
    if (!events) return [];
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (selectedCategory && e.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    });
  }, [events, query, selectedCategory]);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border bg-hero p-8 sm:p-12">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {user ? `Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}` : "Discover events near you"}
          </div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Find the next event worth showing up for.
          </h1>
          <p className="mt-3 text-balance text-sm text-muted-foreground sm:text-base">
            Browse curated experiences, grab your ticket, and we'll hold your spot.
          </p>
          <div className="mt-6 max-w-md">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, venue, description…"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </section>

      {error && <Alert variant="error">{error}</Alert>}

      {categories.length > 0 && (
        <div className="-mb-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Filter</span>
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              !selectedCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c === selectedCategory ? null : c)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium capitalize transition",
                c === selectedCategory
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {!events ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        events.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No events yet"
            description="Once organizers publish events, you'll see them here. Sign in as an organizer to create one."
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Nothing matched"
            description="Try a different search term or clear the category filter."
          />
        )
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
