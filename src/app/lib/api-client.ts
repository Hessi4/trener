'use client';

import { supabase } from './supabase';

/** Calls an application API route with the current Supabase access token. */
export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Sesja wygasła. Zaloguj się ponownie.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(path, { ...init, headers });
}
