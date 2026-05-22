import { clearSession, isTokenExpired, loadToken } from "./auth";

const BASE_URL = (import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL
  || "http://localhost:5000";

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | undefined>;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, code?: string, errors?: ApiError["errors"]) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function buildUrl(path: string, query?: ApiOptions["query"]) {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!opts.skipAuth) {
    const token = loadToken();
    if (token && !isTokenExpired(token)) {
      headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      // Token present but expired — clear it so the UI prompts a fresh login.
      clearSession();
    }
  }

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const body = (payload || {}) as {
    success?: boolean;
    message?: string;
    code?: string;
    data?: T;
    errors?: ApiError["errors"];
  };

  if (!res.ok || body.success === false) {
    // Stale / invalid token from the server — drop the session so the user re-authenticates.
    if (res.status === 401 && ["INVALID_TOKEN", "TOKEN_EXPIRED", "STALE_TOKEN"].includes(body.code || "")) {
      clearSession();
    }
    throw new ApiError(
      body.message || `Request failed with ${res.status}`,
      res.status,
      body.code,
      body.errors,
    );
  }

  return (body.data as T) ?? (body as T);
}
