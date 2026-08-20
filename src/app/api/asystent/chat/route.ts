// src/app/api/asystent/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { wiadomosc, aktualnyPlan, historiaRozmowy, dzisiejszaData } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return Response.json({ error: "Brak klucza API." }, { status: 500 });

    const prompt = `Jesteś elitarnym trenerem personalnym i dietetykiem w aplikacji użytkownika.
Użytkownik pisze do Ciebie wiadomość: "${wiadomosc}".

Kontekst użytkownika:
- Aktualny plan treningowy/dietetyczny: ${JSON.stringify(aktualnyPlan || {})}
- Dzisiejsza data: ${dzisiejszaData}
- Ostatnia historia rozmowy: ${JSON.stringify(historiaRozmowy || [])}

Twoje zadanie to przeanalizować intencję użytkownika i zwrócić WYŁĄCZNIE obiekt JSON w jednym z trzech formatów:

1. Jeśli użytkownik prosi o PORADĘ, PYTA O COŚ LUB ROZMAWIA:
{
  "typAkcji": "ODPOWIEDZ",
  "odpowiedz": "Twoja zwięzła, profesjonalna i pomocna odpowiedź po polsku."
}

2. Jeśli użytkownik zgłasza BÓL, BRAK SPRZĘTU LUB PROSI O ZAMIANĘ/MODYFIKACJĘ PLANU TRENINGOWEGO:
{
  "typAkcji": "ZMIEN_PLAN",
  "odpowiedz": "Wyjaśnienie, co i dlaczego zmieniłeś w planie na dzisiaj/w tygodniu.",
  "zaktualizowanyPlan": { ...pełny obiekt planu taki jak w kontekście, ale z wprowadzonymi bezpiecznymi zamianami ćwiczeń... }
}

3. Jeśli użytkownik pisze, że COŚ ZJADŁ / WYPIŁ (np. "zjadłem banana i wypiłem monsterka"):
{
  "typAkcji": "DODAJ_POSILEK",
  "odpowiedz": "Krótkie potwierdzenie, np. 'Dodałem banana i Monster Ultra (135 kcal) do Twojego bilansu!'",
  "nowyPosilek": {
    "nazwa": "Dokładna nazwa produktów",
    "kalorie": 135,
    "bialko": 1.5,
    "weglowodany": 30,
    "tluszcze": 0.3
  }
}

Zwróć TYLKO czysty JSON zaczynający się od '{' i kończący na '}'. Bez markdowna.`;

    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Błąd API Google.");

    let jsonString = data.candidates[0].content.parts[0].text;
    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) jsonString = match[0];

    const parsedData = JSON.parse(jsonString);
    return Response.json(parsedData);
  } catch (error: any) {
    console.error("Błąd Chat API:", error);
    return Response.json({ error: error?.message || 'Błąd serwera czatu.' }, { status: 500 });
  }
}