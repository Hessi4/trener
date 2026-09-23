// src/app/api/edytor-dnia/route.ts
import { NextResponse } from 'next/server';
import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Awaryjny Groq
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

// Główne zapytanie: Twój Gemini 3.6 Flash
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
    if (!body) return jsonError('Nieprawidłowe dane dnia treningowego.', 400);

    const aktualny = body.aktualny && typeof body.aktualny === 'object'
      ? body.aktualny as Record<string, unknown>
      : body;

    const dzien = requireShortString(aktualny.dzienTygodnia, 30);
    const tytul = requireShortString(aktualny.tytul, 120);
    const typ = requireShortString(aktualny.typ, 30);

    if (!dzien || !tytul || !typ) return jsonError('Brakuje poprawnych danych dnia treningowego.', 400);

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const prompt = `Wygeneruj listę ćwiczeń dla dnia treningowego. 
Dzień: ${dzien}, Tytuł: ${tytul}, Typ aktywności: ${typ}.
Zwróć WYŁĄCZNIE poprawną tablicę JSON w formacie obiektów:
[
  { "nazwa": "Nazwa ćwiczenia lub zadania", "opisSerii": "np. 4x10 lub 8x100m", "uwagiTechniczne": "krótka wskazówka" }
]`;

    let jsonRaw: string | undefined;

    // Próba 1: Twoje Gemini 3.6
    if (apiKey) {
      try {
        jsonRaw = await zapytajGemini(prompt, apiKey);
      } catch (geminiErr: any) {
        console.warn("Gemini 3.6 zawiodło w edytorze dnia. Przełączam na Groq:", geminiErr.message);
      }
    }

    // Próba 2: Groq (uruchamia się tylko jeśli Gemini rzuci błąd)
    if (!jsonRaw) {
      try {
        jsonRaw = await zapytajGroq(prompt);
      } catch (groqErr: any) {
        throw new Error(`Błąd AI (Gemini i Groq niedostępne): ${groqErr.message}`);
      }
    }

    if (!jsonRaw) throw new Error("AI nie zwróciło danych.");

    let cleanJson = jsonRaw;
    if (cleanJson.includes('```json')) {
      cleanJson = cleanJson.split('```json')[1].split('```')[0].trim();
    } else if (cleanJson.includes('```')) {
      cleanJson = cleanJson.split('```')[1].split('```')[0].trim();
    }

    const match = cleanJson.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (match) cleanJson = match[0];

    const parsed = JSON.parse(cleanJson);
    const wygenerowaneCwiczenia = Array.isArray(parsed) ? parsed : (parsed.cwiczenia || []);

    return NextResponse.json(wygenerowaneCwiczenia);

  } catch (error: any) {
    console.error("Błąd API edytora:", error);
    return NextResponse.json({ error: error.message || "Błąd serwera" }, { status: 500 });
  }
}