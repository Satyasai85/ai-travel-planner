/**
 * Central API client.
 *
 * A single fetch wrapper that:
 *  - prefixes every call with the configured backend base URL,
 *  - injects the JWT bearer token from localStorage,
 *  - parses JSON and throws a typed error on non-2xx responses.
 *
 * Keeping all network logic here means components never duplicate auth-header
 * or error-handling boilerplate.
 */

import type {
  CreateTripInput,
  Trip,
  User,
} from '@/types';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

const TOKEN_KEY = 'trao_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Gracefully handle empty responses.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && data.message) || `Request failed (${res.status})`;
    // Auto-logout on auth failure so the UI can redirect to login.
    if (res.status === 401) clearToken();
    throw new ApiError(message, res.status);
  }

  return data as T;
}

/* ------------------------------ Auth API ---------------------------------- */

export const authApi = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => request<{ user: User }>('/api/auth/me'),
};

/* ------------------------------ Trips API --------------------------------- */

export const tripApi = {
  list: () => request<Trip[]>('/api/trips'),

  get: (id: string) => request<Trip>(`/api/trips/${id}`),

  create: (body: CreateTripInput) =>
    request<Trip>('/api/trips', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Trip>) =>
    request<Trip>(`/api/trips/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  remove: (id: string) =>
    request<{ message: string; id: string }>(`/api/trips/${id}`, { method: 'DELETE' }),

  regenerateDay: (id: string, dayNumber: number, feedback: string) =>
    request<Trip>(`/api/trips/${id}/days/${dayNumber}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
};
