// src/app/api/produkt-ai/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

// Awaryjny Groq (uruchamia się tylko w razie problemów z Gemini)
async function rozpoznajProduktGroq(prompt: string) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("Brak klucza GROQ_API_KEY.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Błąd API Groq.");
  return data.choices?.[0]?.message?.content;
}

// Główne wywołanie Twojego Gemini 3.6 Flash
async function rozpoznajProduktGemini(prompt: string, apiKey: string) {
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
    if (!body) return jsonError('Nieprawidłowy kod kreskowy.', 400);
    const barcode = requireShortString(body.barcode, 32);
    if (!barcode || !/^\d{8,14}$/.test(barcode)) return jsonError('Kod kreskowy musi zawierać od 8 do 14 cyfr.', 400);
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const prompt = `
Jesteś bazą danych produktów spożywczych. Użytkownik zeskanował kod kreskowy o numerze: "${barcode}".
Rozpoznaj ten produkt (lub jeśli go nie kojarzysz po kodzie, podaj realistyczne wartości dla typowego produktu spożywczego o takim przeznaczeniu lub zwróć ogólny produkt pasujący do standardów rynkowych w Polsce, np. "Jogurt naturalny").
Zwróć WYŁĄCZNIE poprawny obiekt JSON w formacie:
{
  "nazwa": "Nazwa produktu",
  "marka": "Marka lub Nieznana",
  "kalorieNa100g": 60,
  "bialkoNa100g": 4.5,
  "weglowodanyNa100g": 5.0,
  "tluszczeNa100g": 2.0,
  "zdjecieUrl": ""
}
`;

    let jsonString: string | undefined;

    // Próba 1: Twoje sprawdzone Gemini 3.6 Flash
    if (apiKey) {
      try {
        jsonString = await rozpoznajProduktGemini(prompt, apiKey);
      } catch (geminiError: any) {
        console.warn("Gemini 3.6 zgłosiło błąd przy rozpoznawaniu kodu kreskowego. Przełączam na Groq:", geminiError.message);
      }
    }

    // Próba 2: Groq jako natychmiastowy fallback
    if (!jsonString) {
      try {
        jsonString = await rozpoznajProduktGroq(prompt);
      } catch (groqError: any) {
        throw new Error(`Oba systemy AI zawiodły: ${groqError.message}`);
      }
    }

    if (!jsonString) throw new Error("Pusta odpowiedź z modelu AI.");

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) jsonString = match[0];

    const produktAi = JSON.parse(jsonString);

    return Response.json({
      ...produktAi,
      kodKreskowy: barcode,
      zrodlo: "AI"
    });

  } catch (error: any) {
    console.error("Błąd rozpoznawania produktu:", error);
    return Response.json({ error: error.message || "Błąd rozpoznawania przez AI" }, { status: 500 });
  }
}