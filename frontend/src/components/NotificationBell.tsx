import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { NotificationDoc } from "@/lib/types";

interface ListResponse {
  data: NotificationDoc[];
  meta?: { unread?: number };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationDoc[] | null>(null);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      // The list endpoint returns { data: [...], meta: { unread } }. Our api() helper
      // unwraps `data`, so we use a raw fetch through it that returns the full body.
      const body = await api<ListResponse | NotificationDoc[]>("/api/notifications");
      // body might be the data array (unwrapped) or the full response — handle both.
      if (Array.isArray(body)) {
        setItems(body);
        setUnread(body.filter((n) => !n.isRead).length);
      } else {
        setItems(body.data || []);
        setUnread(body.meta?.unread ?? 0);
      }
    } catch {
      // Swallow — polling errors shouldn't disturb the UI.
    }
  }, [user]);

  // Poll for new notifications every 30s while signed in.
  useEffect(() => {
    if (!user) {
      setItems(null);
      setUnread(0);
      return;
    }
    refresh();
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, [user, refresh]);

  // Click outside closes the panel.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markRead(id: string) {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      setItems((prev) => prev?.map((n) => (n._id === id ? { ...n, isRead: true } : n)) || null);
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* swallow */
    }
  }

  async function markAllRead() {
    try {
      await api("/api/notifications/mark-all-read", { method: "PATCH" });
      setItems((prev) => prev?.map((n) => ({ ...n, isRead: true })) || null);
      setUnread(0);
    } catch {
      /* swallow */
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border bg-card transition hover:bg-accent"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={markAllRead}
                className="-mr-2 h-7 gap-1.5 px-2 text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!items ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                You're all caught up.
              </p>
            ) : (
              <ul className="divide-y">
                {items.map((n) => (
                  <li
                    key={n._id}
                    onClick={() => !n.isRead && markRead(n._id)}
                    className={cn(
                      "cursor-pointer px-4 py-3 transition hover:bg-accent",
                      !n.isRead && "bg-accent/40",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.isRead && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
