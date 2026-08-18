// src/app/api/szukaj-produktu/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { nazwaProduktu } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const prompt = `
Jesteś profesjonalną bazą danych żywności i dietetykiem. Użytkownik szuka produktu o nazwie: "${nazwaProduktu}".
Dopasuj ten produkt do realiów polskich sklepów (np. Biedronka, Lidl, marki ogólnodostępne) i podaj jego średnie wartości odżywcze na 100g.
Zwróć WYŁĄCZNIE poprawny obiekt JSON (bez żadnego dodatkowego tekstu i bez markdowna) w formacie:
{
  "nazwa": "Dokładna nazwa produktu",
  "marka": "Marka lub sklep",
  "kalorieNa100g": 60,
  "bialkoNa100g": 4.5,
  "weglowodanyNa100g": 5.0,
  "tluszczeNa100g": 2.0
}
`;

    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=' + apiKey;
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
    if (!response.ok) throw new Error("Błąd zapytania do AI.");

    const jsonString = data.candidates[0].content.parts[0].text;
    const produkt = JSON.parse(jsonString);

    return Response.json(produkt);

  } catch (error: any) {
    return Response.json({ error: error.message || "Błąd wyszukiwania" }, { status: 500 });
  }
}