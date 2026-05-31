/**
 * Cliente HTTP do backend Taskflow. Substitui o @supabase/supabase-js.
 *
 * - Base URL via VITE_API_URL (default http://localhost:4000).
 * - JWT guardado em localStorage; enviado em Authorization: Bearer.
 * - apiFetch lança ApiError em respostas !ok, com code/status/message do
 *   corpo { error: { code, message } } do backend.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';
const TOKEN_KEY = 'taskflow-token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

async function parseError(res: Response): Promise<ApiError> {
  let code = 'error';
  let message = `Erro ${res.status}`;
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body.error) {
      code = body.error.code ?? code;
      message = body.error.message ?? message;
    }
  } catch {
    // resposta sem corpo JSON — mantém defaults
  }
  return new ApiError(res.status, code, message);
}

/**
 * Requisição JSON autenticada. Anexa o Bearer token automaticamente.
 * `auth: false` para chamadas públicas (ex.: /public/shared/:token).
 */
export async function apiFetch<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  opts: { auth?: boolean } = {}
): Promise<T> {
  const { auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Upload multipart (não usa Content-Type JSON; o browser monta o boundary). */
export async function apiUpload<T = unknown>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}
