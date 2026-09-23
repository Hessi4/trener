// src/app/api/asystent/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

async function zapytajGroq(prompt: string) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("Brak klucza GROQ_API_KEY");

  // Próbujemy llama-3.1-8b-instant
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Błąd Groq API");
  return data.choices?.[0]?.message?.content;
}

async function zapytajGemini(prompt: string) {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!geminiKey) throw new Error("Brak klucza GEMINI_API_KEY");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
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
  if (!res.ok || data.error) throw new Error(data.error?.message || "Błąd Gemini");
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

AKTUALNY STAN I BAZA:
- AKTUALNY PLAN UŻYTKOWNIKA: ${JSON.stringify(aktualnyPlan)}
- ZAPISANE DZISIEJSZE TRENINGI: ${JSON.stringify(zapisaneTreningi)}
- ZAPISANE DZISIEJSZE POSIŁKI: ${JSON.stringify(zapisanePosilki)}
- OSTATNIE WIADOMOŚCI: ${JSON.stringify(historiaRozmowy)}
- DZISIEJSZA DATA: ${dzisiejszaData}

ZADANIE:
Zwróć TYLKO czysty obiekt JSON odpowiadający jednej z 3 sytuacji:

1. Jeśli użytkownik prosi o DODANIE, ROZPISANIE lub ZMIANĘ w planie treningowym (np. "dodaj basen na 1000m", "zmień plan", "rozpisz mi to"):
Musisz zmodyfikować lub dodać wpis w tablicy "treningiTygodnia" w obiekcie planu!
{
  "typAkcji": "ZMIEN_PLAN",
  "odpowiedz": "Jasne! Dodałem i rozpisałem trening w Twoim planie tygodniowym.",
  "zaktualizowanyPlan": {
    ...weź cały obiekt AKTUALNY PLAN UŻYTKOWNIKA, dodaj lub podmień odpowiedni dzień w treningiTygodnia z polami: dzienTygodnia, typ, tytul, akcent, cwiczeniaIZadania (gdzie każde zadanie ma nazwa, opisSerii, uwagiTechniczne)...
  }
}

2. Jeśli użytkownik dodaje posiłek (np. "zjadłem twaróg 200g"):
{
  "typAkcji": "DODAJ_POSILEK",
  "odpowiedz": "Dodałem posiłek do dziennika!",
  "nowyPosilek": {
    "nazwa": "Twaróg chudy",
    "kalorie": 180,
    "bialko": 36,
    "weglowodany": 6,
    "tluszcze": 1
  }
}

3. Zwykła odpowiedź lub porada:
{
  "typAkcji": "ODPOWIEDZ",
  "odpowiedz": "Treść porady trenera."
}`;

    let jsonString: string | undefined;

    // Próba 1: Groq (szybki i darmowy)
    try {
      jsonString = await zapytajGroq(prompt);
    } catch (gErr: any) {
      console.warn("Groq nie powiódł się, przełączam na Gemini:", gErr.message);
      // Próba 2: Gemini
      try {
        jsonString = await zapytajGemini(prompt);
      } catch (gemErr: any) {
        throw new Error(`Błąd AI: ${gErr.message} | ${gemErr.message}`);
      }
    }

    if (!jsonString) throw new Error("Brak odpowiedzi od silników AI.");

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