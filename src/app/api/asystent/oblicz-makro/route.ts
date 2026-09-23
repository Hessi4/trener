// src/app/api/oblicz-makro/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

// Awaryjny Groq (uruchamia się tylko w razie problemów z Gemini)
async function obliczMakroGroq(prompt: string) {
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
      temperature: 0.1
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Błąd API Groq.");
  return data.choices?.[0]?.message?.content;
}

// Główne wywołanie Twojego Gemini 3.6 Flash
async function obliczMakroGemini(prompt: string, apiKey: string) {
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
    if (!body) return jsonError('Nieprawidłowe dane posiłku.', 400);
    const posilek = requireShortString(body.posilek, 500);
    const waga = typeof body.waga === 'string' || typeof body.waga === 'number' ? String(body.waga).slice(0, 10) : '';
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!posilek) return Response.json({ error: "Brak nazwy posiłku." }, { status: 400 });

    const prompt = `Jesteś ekspertem dietetyki. Użytkownik zjadł: "${posilek}".
Podana gramatura porcji to: ${waga ? waga + 'g' : 'nie podano (przyjmij standardową porcję)'}.
Oblicz i oszacuj makroskładniki oraz kalorie dla tej porcji. Zwróć ujednoliconą nazwę, dodając do niej wagę.

Zwróć WYŁĄCZNIE obiekt JSON wg schematu:
{
  "skorygowanaNazwa": "np. Makaron z kurczakiem (350g)",
  "kalorie": 450,
  "bialko": 35,
  "weglowodany": 50,
  "tluszcze": 12
}`;

    let jsonString: string | undefined;

    // Próba 1: Twoje Gemini 3.6 Flash
    if (apiKey) {
      try {
        jsonString = await obliczMakroGemini(prompt, apiKey);
      } catch (geminiError: any) {
        console.warn("Gemini 3.6 zgłosiło błąd przy obliczaniu makro. Przełączam na Groq:", geminiError.message);
      }
    }

    // Próba 2: Groq jako natychmiastowy fallback
    if (!jsonString) {
      try {
        jsonString = await obliczMakroGroq(prompt);
      } catch (groqError: any) {
        throw new Error(`Oba systemy AI zawiodły: ${groqError.message}`);
      }
    }

    if (!jsonString) throw new Error("Brak danych z modelu AI.");

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) jsonString = match[0];

    return Response.json(JSON.parse(jsonString));
  } catch (error: any) {
    console.error("Błąd obliczania makro:", error);
    return Response.json({ error: error?.message || 'Błąd serwera.' }, { status: 500 });
  }
}