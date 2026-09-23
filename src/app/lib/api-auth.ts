import 'server-only';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type RateLimitEntry = { count: number; resetAt: number };
const rateLimits = new Map<string, RateLimitEntry>();

export async function getAuthenticatedUserId(request: Request): Promise<string | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token || !supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

/** A basic safety net. Use a shared store (e.g. Upstash) when deploying multiple instances. */
export function isRateLimited(userId: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = rateLimits.get(userId);

  if (!current || current.resetAt <= now) {
    rateLimits.set(userId, { count: 1, resetAt: now + windowMs });
    return false;
  }

  current.count += 1;
  return current.count > limit;
}

export function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 50_000) return null;

  try {
    const data: unknown = await request.json();
    return data && typeof data === 'object' && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function requireShortString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
    ? value.trim()
    : null;
}

export async function authorizeAiRequest(request: Request): Promise<string | Response> {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return jsonError('Zaloguj się, aby skorzystać z asystenta AI.', 401);
  if (isRateLimited(userId)) return jsonError('Zbyt wiele zapytań. Spróbuj ponownie za minutę.', 429);
  return userId;
}
