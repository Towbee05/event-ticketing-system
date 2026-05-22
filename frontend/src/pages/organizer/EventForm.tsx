import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/Alert";
import { PageHeader } from "@/components/PageHeader";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import type { EventDoc } from "@/lib/types";

interface FormState {
  title: string;
  description: string;
  date: string;
  venue: string;
  category: string;
  bannerImage: string;
  status: EventDoc["status"];
}

const empty: FormState = {
  title: "",
  description: "",
  date: "",
  venue: "",
  category: "",
  bannerImage: "",
  status: "draft",
};

function toLocalDateTimeInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    api<EventDoc>(`/api/events/${id}`)
      .then((e) =>
        setForm({
          title: e.title,
          description: e.description,
          date: toLocalDateTimeInput(e.date),
          venue: e.venue,
          category: e.category || "",
          bannerImage: e.bannerImage || "",
          status: e.status,
        }),
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      // organizer is set server-side from the JWT — don't send it from the client.
      const payload = {
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        venue: form.venue,
        category: form.category,
        bannerImage: form.bannerImage,
        status: form.status,
      };
      if (isEdit) {
        await api(`/api/events/${id}`, { method: "PUT", body: payload });
        toast.success("Event updated");
      } else {
        await api("/api/events", { method: "POST", body: payload });
        toast.success("Event created");
      }
      navigate("/organizer/events");
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const fe: Record<string, string> = {};
        for (const item of e.errors) fe[item.field] = item.message;
        setFieldErrors(fe);
      }
      const msg = e instanceof Error ? e.message : "Save failed";
      setError(msg);
      toast.error("Couldn't save event", msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!id) return;
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await api(`/api/events/${id}`, { method: "DELETE" });
      toast.success("Event deleted");
      navigate("/organizer/events");
    } catch (e) {
      toast.error("Delete failed", e instanceof Error ? e.message : undefined);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to events
        </Link>
      </div>

      <PageHeader
        eyebrow={isEdit ? "Edit event" : "New event"}
        title={isEdit ? form.title || "Edit event" : "Create an event"}
        description={
          isEdit
            ? "Drafts stay hidden from attendees until you publish."
            : "Fill in the details. You can save as draft and publish later."
        }
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="e.g. Nigeria Tech Summit 2026"
              />
              {fieldErrors.title && <p className="text-xs text-destructive">{fieldErrors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                rows={4}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="What can attendees expect? Speakers, agenda, highlights…"
              />
              {fieldErrors.description && <p className="text-xs text-destructive">{fieldErrors.description}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date &amp; time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  required
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
                {fieldErrors.date && <p className="text-xs text-destructive">{fieldErrors.date}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  required
                  value={form.venue}
                  onChange={(e) => update("venue", e.target.value)}
                  placeholder="Eko Convention Center, Lagos"
                />
                {fieldErrors.venue && <p className="text-xs text-destructive">{fieldErrors.venue}</p>}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="music, tech, sports…"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="banner">Banner image URL</Label>
                <Input
                  id="banner"
                  value={form.bannerImage}
                  onChange={(e) => update("bannerImage", e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v as EventDoc["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft — only you can see it</SelectItem>
                  <SelectItem value="published">Published — visible to attendees</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <Alert variant="error">{error}</Alert>}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <div className="flex gap-2">
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? "Saving…" : isEdit ? "Save changes" : "Create event"}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
              {isEdit && (
                <Button type="button" variant="ghost" className="text-destructive" onClick={remove}>
                  <Trash2 className="h-4 w-4" /> Delete event
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
