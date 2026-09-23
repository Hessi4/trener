// src/app/api/asystent/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

// Główne zapytanie – dokładnie Twój model gemini-3.6-flash
async function zapytajGemini(prompt: string) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!geminiKey) throw new Error("Brak klucza GEMINI_API_KEY w zmiennych środowiskowych.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Błąd Gemini: ${res.status}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function POST(req: Request) {
  try {
    const authorization = await authorizeAiRequest(req);
    if (authorization instanceof Response) return authorization;
    const body = await readJsonObject(req);
    if (!body) return jsonError('Nieprawidłowe dane.', 400);

    const wiadomosc = requireShortString(body.wiadomosc, 2000);
    if (!wiadomosc) return jsonError('Brak wiadomości.', 400);

    const aktualnyPlan = body.aktualnyPlan || {};
    const zapisaneTreningi = Array.isArray(body.zapisaneTreningi) ? body.zapisaneTreningi.slice(0, 50) : [];
    const zapisanePosilki = Array.isArray(body.zapisanePosilki) ? body.zapisanePosilki.slice(0, 50) : [];
    const historiaRozmowy = Array.isArray(body.historiaRozmowy) ? body.historiaRozmowy.slice(-6) : [];
    const dzisiejszaData = typeof body.dzisiejszaData === 'string' ? body.dzisiejszaData.slice(0, 10) : '';

    const prompt = `Jesteś głównym trenerem i dietetykiem aplikacji sportowej NEXUS.
Użytkownik pisze do Ciebie: "${wiadomosc}".

DANE UŻYTKOWNIKA:
- GŁÓWNY PLAN TRENINGOWY: ${JSON.stringify(aktualnyPlan)}
- DZISIEJSZE TRENINGI: ${JSON.stringify(zapisaneTreningi)}
- DZISIEJSZE POSIŁKI: ${JSON.stringify(zapisanePosilki)}
- OSTATNIE WIADOMOŚCI: ${JSON.stringify(historiaRozmowy)}
- DZISIEJSZA DATA: ${dzisiejszaData}

ZADANIE:
Zwróć TYLKO czysty obiekt JSON bez znaczników markdown, dopasowując jedną z trzech akcji:

1. Jeśli użytkownik prosi o DODANIE, ROZPISANIE lub ZMIANĘ w planie treningowym (np. "dodaj basen koło 1000m", "zmień trening", "rozpisz mi to"):
Musisz zaktualizować lub dopisać odpowiedni dzień w tablicy "treningiTygodnia" w obiekcie planu!
{
  "typAkcji": "ZMIEN_PLAN",
  "odpowiedz": "Jasne! Rozpisałem delikatny trening na basenie (~1000m) i zaktualizowałem Twój plan.",
  "zaktualizowanyPlan": {
    ...weź cały obiekt GŁÓWNY PLAN TRENINGOWY, zaktualizuj odpowiedni dzień w "treningiTygodnia" wstawiając ćwiczenia z nazwami, seriami (opisSerii) i wskazówkami...
  }
}

2. Jeśli użytkownik zgłasza zjedzony posiłek:
{
  "typAkcji": "DODAJ_POSILEK",
  "odpowiedz": "Dodałem posiłek do Twojego bilansu!",
  "nowyPosilek": {
    "nazwa": "Nazwa posiłku",
    "kalorie": 250,
    "bialko": 20,
    "weglowodany": 30,
    "tluszcze": 5
  }
}

3. Zwykła rozmowa lub porada:
{
  "typAkcji": "ODPOWIEDZ",
  "odpowiedz": "Treść porady trenera."
}`;

    // Bezpośrednie wywołanie Twojego modelu gemini-3.6-flash
    const jsonString = await zapytajGemini(prompt);

    if (!jsonString) throw new Error("Brak odpowiedzi od Gemini 3.6.");

    let clean = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) clean = match[0];

    const wynik = JSON.parse(clean);
    return Response.json(wynik);

  } catch (err: any) {
    console.error("Błąd Chat API:", err);
    return Response.json({ error: err.message || "Błąd przetwarzania wiadomości." }, { status: 500 });
  }
}