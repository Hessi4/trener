// src/app/api/edytor-dnia/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const aktualny = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Brak klucza API GEMINI_API_KEY w zmiennych środowiskowych." }, { status: 500 });
    }

    const prompt = `Wygeneruj listę ćwiczeń dla dnia treningowego. 
Dzień: ${aktualny.dzienTygodnia}, Tytuł: ${aktualny.tytul}, Typ aktywności: ${aktualny.typ}.
Zwróć WYŁĄCZNIE poprawną tablicę JSON w formacie obiektów:
[
  { "nazwa": "Nazwa ćwiczenia lub zadania", "opisSerii": "np. 4x10 lub 8x100m", "uwagiTechniczne": "krótka wskazówka" }
]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.3,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API error: ${errText}`);
    }

    const data = await response.json();
    let jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonString) {
      throw new Error("Pusta odpowiedź z modelu AI.");
    }

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const wygenerowaneCwiczenia = JSON.parse(jsonString);
    return NextResponse.json(wygenerowaneCwiczenia);

  } catch (error: any) {
    console.error("Błąd API edytora:", error);
    return NextResponse.json({ error: error.message || "Błąd serwera" }, { status: 500 });
  }
}