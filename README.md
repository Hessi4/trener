# NEXUS — trener AI

Aplikacja do planowania treningów, diety, pomiarów i skanowania produktów. Uwierzytelnianie oraz dane użytkownika obsługuje Supabase, a generowanie planów — Gemini API.

## Uruchomienie

```bash
npm install
npm run dev
```

W pliku `.env.local` ustaw:

```env
NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=twoj_anon_key
GEMINI_API_KEY=klucz_tylko_po_stronie_serwera
```

Nie używaj `NEXT_PUBLIC_GEMINI_API_KEY`: zmienne z tym prefiksem trafiają do kodu przeglądarki.

## Supabase i bezpieczeństwo danych

W SQL Editor Supabase uruchom migrację `supabase/migrations/20260915_enable_user_data_rls.sql`. Zakłada ona, że tabele `plany`, `treningi`, `posilki` i `pomiary` mają kolumnę `user_id uuid`, powiązaną z `auth.users.id`.

Po włączeniu RLS każdy użytkownik może odczytywać i zmieniać wyłącznie swoje rekordy.

## Kontrola jakości

```bash
npx tsc --noEmit
npm run lint
npm run build
```

`tsc` i build powinny przechodzić. Lint nadal wskazuje historyczne użycia `any` i kilka efektów Reacta do stopniowego uporządkowania.
