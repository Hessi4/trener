// src/app/api/asystent/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

// Zapasowe wywołanie Groq na wypadek awarii Google
async function zapytajGroq(prompt: string) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("Brak klucza GROQ_API_KEY.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Błąd API Groq.");
  return data.choices?.[0]?.message?.content;
}

// Główne wywołanie Twojego działającego Gemini 3.6
async function zapytajGemini(prompt: string, apiKey: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
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

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function POST(req: Request) {
  try {
    const authorization = await authorizeAiRequest(req);
    if (authorization instanceof Response) return authorization;
    const body = await readJsonObject(req);
    if (!body) return jsonError('Nieprawidłowa wiadomość.', 400);
    const wiadomosc = requireShortString(body.wiadomosc, 2_000);
    if (!wiadomosc) return jsonError('Wiadomość musi mieć od 1 do 2000 znaków.', 400);

    const aktualnyPlan = body.aktualnyPlan;
    const zapisaneTreningi = Array.isArray(body.zapisaneTreningi) ? body.zapisaneTreningi.slice(0, 100) : [];
    const zapisanePosilki = Array.isArray(body.zapisanePosilki) ? body.zapisanePosilki.slice(0, 100) : [];
    const historiaRozmowy = Array.isArray(body.historiaRozmowy) ? body.historiaRozmowy.slice(-6) : [];
    const dzisiejszaData = typeof body.dzisiejszaData === 'string' ? body.dzisiejszaData.slice(0, 10) : '';

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const dzisiejszeTreningi = zapisaneTreningi || [];
    const dzisiejszePosilki = zapisanePosilki || [];

    const prompt = `Jesteś elitarnym trenerem personalnym i dietetykiem w aplikacji sportowej NEXUS.
Użytkownik pisze: "${wiadomosc}".

DANE UŻYTKOWNIKA NA DZIEŃ DZISIEJSZY (${dzisiejszaData}):
- WYKONANE DZISIAJ TRENINGI/SERIE: ${JSON.stringify(dzisiejszeTreningi)}
- ZJEDZONE DZISIAJ POSIŁKI: ${JSON.stringify(dzisiejszePosilki)}
- OGÓLNY PLAN I CELE MAKRO: ${JSON.stringify(aktualnyPlan || {})}
- HISTORIA CZATU: ${JSON.stringify(historiaRozmowy || [])}

Twoje zadanie:
Przeanalizuj wiadomość użytkownika i dopasuj JEDNĄ z możliwych akcji.
Zwróć WYŁĄCZNIE poprawny, czysty format JSON bez żadnych znaczników markdown:

1. Jeśli odpowiadasz / podsumowujesz dzień / dajesz wskazówkę:
{
  "typAkcji": "ODPOWIEDZ",
  "odpowiedz": "Twoja konkretna, zwięzła i motywująca odpowiedź."
}

2. Jeśli użytkownik prosi o ZAPISANIE / ROZPISANIE / DODANIE NOWEGO TRENINGU (np. "zrobiłem trening nóg", "dodaj basen 45 min", "rozpisz trening na dziś"):
{
  "typAkcji": "DODAJ_TRENING",
  "odpowiedz": "Krótkie podsumowanie dodanego treningu i wskazówki techniczne.",
  "nowyTrening": {
    "nazwa": "Nazwa treningu (np. Trening Siłowy - Nogi lub Sesja Basen)",
    "kategoria": "Siłownia",
    "czasTrwaniaMin": 45,
    "cwiczenia": [
      { "nazwa": "Nazwa ćwiczenia", "opisSerii": "np. 4x10", "uwagiTechniczne": "Wskazówka techniczna" }
    ]
  }
}

3. Jeśli użytkownik prosi o ZMIANĘ / USUNIĘCIE / ZASTĄPIENIE ćwiczeń w stałym planie (np. "zamień ketle na hantle", "usuń martwy ciąg"):
{
  "typAkcji": "ZMIEN_PLAN",
  "odpowiedz": "Krótki opis co dokładnie zostało zmienione w planie.",
  "zaktualizowanyPlan": { 
    ...CAŁY kompletny obiekt planu użytkownika z naniesionymi modyfikacjami ćwiczeń, zachowując strukturę treningiTygodnia i pozostałe dni nienaruszone...
  }
}

4. Jeśli użytkownik zgłasza spożyty posiłek lub produkt (np. "zjadłem jabłko", "wpadło 200g piersi z kurczaka z ryżem"):
{
  "typAkcji": "DODAJ_POSILEK",
  "odpowiedz": "Krótkie potwierdzenie dodania posiłku z wyliczonym makro.",
  "nowyPosilek": {
    "nazwa": "Precyzyjna nazwa potrawy z gramaturą",
    "kalorie": 180,
    "bialko": 4.5,
    "weglowodany": 38.0,
    "tluszcze": 1.2
  }
}`;


    let jsonRaw: string | undefined;

    // Próba główna: Twoje sprawdzone Gemini 3.6 Flash
    if (apiKey) {
      try {
        jsonRaw = await zapytajGemini(prompt, apiKey);
      } catch (geminiError: any) {
        console.warn("Gemini 3.6 zwróciło błąd. Przełączam awaryjnie na Groq:", geminiError.message);
      }
    }

    // Fallback: Groq (uruchamia się tylko jeśli Gemini zawiedzie)
    if (!jsonRaw) {
      try {
        jsonRaw = await zapytajGroq(prompt);
      } catch (groqError: any) {
        throw new Error(`Błąd AI (Gemini i Groq niedostępne): ${groqError.message}`);
      }
    }

      if (!jsonRaw) throw new Error("AI nie zwróciło danych.");

    let cleanJson = jsonRaw;
    if (cleanJson.includes('```json')) {
      cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
    } else if (cleanJson.includes('```')) {
      cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
    }

    const match = cleanJson.match(/\{[\s\S]*\}/);
    if (match) cleanJson = match[0];

    const parsedData = JSON.parse(cleanJson);
    return Response.json(parsedData);

  } catch (error: any) {
    console.error("Błąd Chat API:", error);
    return Response.json({ error: error?.message || 'Błąd serwera czatu.' }, { status: 500 });
  }
}