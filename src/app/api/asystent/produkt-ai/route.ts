// src/app/api/produkt-ai/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { barcode } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Brak klucza API GEMINI_API_KEY w konfiguracji." }, { status: 500 });
    }

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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          thinkingConfig: {
            thinkingBudget: 0
          }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Błąd zapytania do AI.");

    let jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonString) throw new Error("Pusta odpowiedź z modelu AI.");

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

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