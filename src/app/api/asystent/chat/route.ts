// src/app/api/asystent/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { wiadomosc, aktualnyPlan, zapisaneTreningi, zapisanePosilki, historiaRozmowy, dzisiejszaData } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) return Response.json({ error: "Brak klucza API GEMINI_API_KEY w zmiennych środowiskowych." }, { status: 500 });

    // Filtrujemy dane z dzisiejszego dnia
    
    const dzisiejszeTreningi = zapisaneTreningi || [];
    const dzisiejszePosilki = zapisanePosilki || [];

    const prompt = `Jesteś profesjonalnym trenerem personalnym i dietetykiem w aplikacji użytkownika.
Użytkownik pisze: "${wiadomosc}".

DANE UŻYTKOWNIKA NA DZIEŃ DZISIEJSZY (${dzisiejszaData}):
- WYKONANE DZISIAJ TRENINGI/SERIE: ${JSON.stringify(dzisiejszeTreningi)}
- ZJEDZONE DZISIAJ POSIŁKI: ${JSON.stringify(dzisiejszePosilki)}
- OGÓLNY PLAN I CELE MAKRO: ${JSON.stringify(aktualnyPlan || {})}
- HISTORIA CZATU: ${JSON.stringify(historiaRozmowy || [])}

Twoje zadanie:
Przeanalizuj pytanie użytkownika. Jeśli prosi o podsumowanie dnia, odnieś się DOKŁADNIE do zarejestrowanych dzisiejszych treningów (serie, ciężary, dystanse, czasy) oraz posiłków (zjedzone kalorie vs cel).

Zwróć WYŁĄCZNIE poprawny format JSON (schemat wyjściowy):

1. Jeśli odpowiadasz / podsumowujesz dzień / dajesz poradę:
{
  "typAkcji": "ODPOWIEDZ",
  "odpowiedz": "Twoja konkretna, czytelna odpowiedź z podsumowaniem (np. punktowo: Trening, Dieta, Wnioski)."
}

2. Jeśli użytkownik prosi o ZMIANĘ / ZASTĄPIENIE ćwiczeń w planie:
{
  "typAkcji": "ZMIEN_PLAN",
  "odpowiedz": "Opis co zmieniłeś i dlaczego.",
  "zaktualizowanyPlan": { ...cały zaktualizowany obiekt planu... }
}

3. Jeśli użytkownik zgłasza nowy posiłek (np. "zjadłem 2 banany"):
{
  "typAkcji": "DODAJ_POSILEK",
  "odpowiedz": "Krótkie potwierdzenie dodania.",
  "nowyPosilek": {
    "nazwa": "Nazwa posiłku",
    "kalorie": 200,
    "bialko": 2.5,
    "weglowodany": 50,
    "tluszcze": 0.5
  }
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json",
          temperature: 0.3,
          thinkingConfig: {
    mode: "OFF"
  }
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Błąd API Google.");

    let jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonString) throw new Error("Pusta odpowiedź z modelu AI.");

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) jsonString = match[0];

    const parsedData = JSON.parse(jsonString);
    return Response.json(parsedData);
  } catch (error: any) {
    console.error("Błąd Chat API:", error);
    return Response.json({ error: error?.message || 'Błąd serwera czatu.' }, { status: 500 });
  }

  
}