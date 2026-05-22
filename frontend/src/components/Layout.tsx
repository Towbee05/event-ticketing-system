import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Ticket, LogOut, ChevronDown, User as UserIcon, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function initialsOf(name?: string | null, fallback?: string) {
  const source = (name && name.trim()) || fallback || "?";
  return source
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-2 text-sm shadow-sm transition hover:bg-accent"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initialsOf(user.name, user.email)}
        </span>
        <span className="hidden text-xs font-medium sm:inline">{user.name || user.email}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-lg">
          <div className="border-b px-3 py-2 text-xs">
            <p className="font-medium">{user.name}</p>
            <p className="truncate text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-2 capitalize">{user.role}</Badge>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/profile");
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
          >
            <UserIcon className="h-4 w-4 text-muted-foreground" /> Profile
          </button>
          {user.role === "admin" && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/admin");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/login");
            }}
            className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ["/login", "/forgot-password", "/reset-password"].includes(location.pathname);

  const navItems: { to: string; label: string; show: boolean }[] = [
    { to: "/events", label: "Events", show: true },
    { to: "/my-tickets", label: "My Tickets", show: !!user },
    { to: "/my-orders", label: "My Orders", show: !!user },
    {
      to: "/organizer",
      label: "Organizer",
      show: user?.role === "organizer" || user?.role === "admin",
    },
    {
      to: "/organizer/scan",
      label: "Scan",
      show: user?.role === "organizer" || user?.role === "admin",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Ticket className="h-4 w-4" />
            </span>
            Eventu
          </Link>
          <nav className="hidden items-center gap-6 text-sm sm:flex">
            {navItems
              .filter((n) => n.show)
              .map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      "transition-colors",
                      isActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {n.label}
                </NavLink>
              ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <NotificationBell />
                <AvatarMenu />
              </>
            ) : (
              !isAuthPage && (
                <Button size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>
      <main className="container flex-1 py-8">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Built with the Event Management & Ticketing System.
      </footer>
    </div>
  );
}
