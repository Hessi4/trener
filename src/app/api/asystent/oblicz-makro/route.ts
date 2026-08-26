// src/app/api/oblicz-makro/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { posilek, waga } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) return Response.json({ error: "Brak klucza API GEMINI_API_KEY w zmiennych środowiskowych." }, { status: 500 });
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

    // Endpoint v1beta dla modelu gemini-3.6-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json", 
          temperature: 0.1,
          thinkingConfig: {
    mode: "OFF"
  }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Błąd API Google.");

    let jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonString) throw new Error("Brak danych z modelu AI.");

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    return Response.json(JSON.parse(jsonString));
  } catch (error: any) {
    console.error("Błąd obliczania makro:", error);
    return Response.json({ error: error?.message || 'Błąd serwera.' }, { status: 500 });
  }
}