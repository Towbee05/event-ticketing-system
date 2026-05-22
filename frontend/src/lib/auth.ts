export type Role = "attendee" | "organizer" | "admin";

export interface User {
  id: string;
  role: Role;
  name?: string;
  email?: string;
}

const TOKEN_KEY = "etb.token";
const USER_KEY = "etb.user";

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function loadUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Decodes JWT payload without verifying signature — purely to read claims client-side.
// (Trust still flows from the backend re-verifying on every request.)
export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded + "===".slice((padded.length + 3) % 4));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt<{ exp?: number }>(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
}
