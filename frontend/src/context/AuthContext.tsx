import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clearSession,
  isTokenExpired,
  loadToken,
  loadUser,
  saveSession,
  type Role,
  type User,
} from "@/lib/auth";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadUser());
  const [token, setToken] = useState<string | null>(() => {
    const t = loadToken();
    return t && !isTokenExpired(t) ? t : null;
  });
  const [ready, setReady] = useState(false);

  // On mount, if we have a token, re-fetch /me to confirm it's still valid server-side
  // (covers password-changed-after, deleted user, server-side rotated secret, etc.).
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const fresh = await api<{ id: string; role: Role; name?: string; email?: string }>("/api/auth/me");
        if (!cancelled) {
          const u: User = { id: fresh.id, role: fresh.role, name: fresh.name, email: fresh.email };
          saveSession(token, u);
          setUser(u);
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // Only run once — subsequent token changes go through setSession/logout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSession = useCallback((newToken: string, newUser: User) => {
    saveSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    const fresh = await api<{ id: string; role: Role; name?: string; email?: string }>("/api/auth/me");
    const u: User = { id: fresh.id, role: fresh.role, name: fresh.name, email: fresh.email };
    const t = loadToken();
    if (t) saveSession(t, u);
    setUser(u);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, setSession, logout, refreshMe }),
    [user, token, ready, setSession, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
