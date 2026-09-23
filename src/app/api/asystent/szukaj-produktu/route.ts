// src/app/api/asystent/szukaj-produktu/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { authorizeAiRequest, jsonError, readJsonObject, requireShortString } from '@/app/lib/api-auth';

// Awaryjne wywołanie Groq
async function szukajProduktuGroq(prompt: string) {
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
      messages: [
        {
          role: "system",
          content: "Jesteś wyszukiwarką dietetyczną. Zwracasz WYŁĄCZNIE poprawny JSON zawierający listę wariantów produktu."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Błąd API Groq.");
  return data.choices?.[0]?.message?.content;
}

// Główne wywołanie Twojego Gemini 3.6 Flash
async function szukajProduktuGemini(prompt: string, apiKey: string) {
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
    if (!body) return jsonError('Nieprawidłowe dane wyszukiwania.', 400);
    const nazwaProduktu = requireShortString(body.nazwaProduktu, 200);
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!nazwaProduktu) {
      return Response.json({ error: "Brak nazwy szukanego produktu." }, { status: 400 });
    }

    const prompt = `Jesteś zaawansowaną wyszukiwarką dietetyczną.
Zadanie: Użytkownik szuka hasła: "${nazwaProduktu}".

Wypisz od 2 do 8 RZECZYWISTYCH wariantów tego produktu. 
- Jeśli użytkownik wpisał ogólne hasło (np. "mleko"), podaj różne zawartości tłuszczu i popularne marki (Biedronka, Lidl, Łaciate).
- Jeśli użytkownik podał konkretną markę i smak (np. "Tymbark jabłko"), wypisz wszystkie znane kombinacje tego smaku (np. Jabłko-Mięta, Jabłko-Brzoskwinia, Jabłko-Arbuz, itp.).

Zwróć TYLKO kod JSON w postaci tablicy obiektów wg schematu:
[
  {
    "nazwa": "Pełna nazwa wariantu (np. Tymbark Jabłko-Mięta)",
    "marka": "Nazwa marki lub sklepu",
    "kalorieNa100g": 42,
    "bialkoNa100g": 0.1,
    "weglowodanyNa100g": 10,
    "tluszczeNa100g": 0
  }
]`;

    let jsonString: string | undefined;

    // Próba 1: Twoje Gemini 3.6 Flash
    if (apiKey) {
      try {
        jsonString = await szukajProduktuGemini(prompt, apiKey);
      } catch (geminiError: any) {
        console.warn("Gemini 3.6 zgłosiło błąd przy szukaniu produktu. Przełączam na Groq:", geminiError.message);
      }
    }

    // Próba 2: Groq jako awaryjny fallback
    if (!jsonString) {
      try {
        jsonString = await szukajProduktuGroq(prompt);
      } catch (groqError: any) {
        throw new Error(`Oba systemy AI zawiodły: ${groqError.message}`);
      }
    }

    if (!jsonString) {
      throw new Error("Pusta odpowiedź z modelu AI.");
    }

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const arrayMatch = jsonString.match(/\[[\s\S]*\]/) || jsonString.match(/\{[\s\S]*\}/);
    if (arrayMatch) {
      jsonString = arrayMatch[0];
    }

    try {
      let parsedData = JSON.parse(jsonString);

      if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        if (parsedData.warianty) parsedData = parsedData.warianty;
        else if (parsedData.produkty) parsedData = parsedData.produkty;
        else parsedData = Object.values(parsedData).find(Array.isArray) || [parsedData];
      }

      if (!Array.isArray(parsedData)) parsedData = [parsedData];

      return Response.json(parsedData);
    } catch {
      throw new Error("AI popsuło formatowanie JSON: " + jsonString.substring(0, 30) + "...");
    }

  } catch (error: any) {
    console.error("Błąd wyszukiwania produktu:", error);
    return Response.json({ error: error?.message || 'Nieznany błąd serwera.' }, { status: 500 });
  }
}