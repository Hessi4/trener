// src/app/api/edytor-dnia/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const aktualny = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Brak klucza API." }, { status: 500 });
    }

    const prompt = `Wygeneruj listę ćwiczeń dla dnia treningowego. 
Dzień: ${aktualny.dzienTygodnia}, Tytuł: ${aktualny.tytul}, Typ aktywności: ${aktualny.typ}.
Zwróć WYŁĄCZNIE poprawną tablicę JSON w formacie obiektów. Bez żadnego dodatkowego tekstu i bez znaczników markdown. Format:
[
  { "nazwa": "Nazwa ćwiczenia lub zadania", "opisSerii": "np. 4x10 lub 8x100m", "uwagiTechniczne": "krótka wskazówka" }
]`;

    // Używamy stabilnego modelu i wersji v1beta, która obsługuje ten klucz
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google API error: ${errText}`);
    }

    const data = await response.json();
    let jsonString = data.candidates[0].content.parts[0].text;
    
    // Czyszczenie znaczników markdown
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