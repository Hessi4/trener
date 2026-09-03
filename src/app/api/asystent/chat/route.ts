// src/app/api/asystent/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { 
      wiadomosc, 
      aktualnyPlan, 
      zapisaneTreningi, 
      zapisanePosilki, 
      historiaRozmowy, 
      dzisiejszaData 
    } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Brak klucza API GEMINI_API_KEY w zmiennych środowiskowych." }, 
        { status: 500 }
      );
    }

    const dzisiejszeTreningi = zapisaneTreningi || [];
    const dzisiejszePosilki = zapisanePosilki || [];

    const prompt = `Jesteś elitarnym trenerem personalnym i dietetykiem w aplikacji sportowej NEXUS.
Użytkownik pisze: "${wiadomosc}".

DANE UŻYTKOWNIKA NA DZIEŃ DZISIEJSZY (${dzisiejszaData}):
- WYKONANE DZISIAJ TRENINGI/SERIE: ${JSON.stringify(dzisiejszeTreningi)}
- ZJEDZONE DZISIAJ POSIŁKI: ${JSON.stringify(dzisiejszePosilki)}
- OGÓLNY PLAN I CELE MAKRO: ${JSON.stringify(aktualnyPlan || {})}
- HISTORIA CZATU: ${JSON.stringify(historiaRozmowy || [])}

Twoje zadanie:
Przeanalizuj wiadomość użytkownika i dopasuj JEDNĄ z trzech możliwych akcji.
Zwróć WYŁĄCZNIE poprawny, czysty format JSON bez żadnych znaczników markdown:

1. Jeśli odpowiadasz / podsumowujesz dzień / dajesz wskazówkę:
{
  "typAkcji": "ODPOWIEDZ",
  "odpowiedz": "Twoja konkretna, zwięzła i motywująca odpowiedź."
}

2. Jeśli użytkownik prosi o ZMIANĘ / USUNIĘCIE / ZASTĄPIENIE ćwiczeń w planie (np. "zamień ketle na hantle", "usuń martwy ciąg"):
{
  "typAkcji": "ZMIEN_PLAN",
  "odpowiedz": "Krótki opis co dokładnie zostało zmienione w planie.",
  "zaktualizowanyPlan": { 
    ...CAŁY kompletny obiekt planu użytkownika z naniesionymi modyfikacjami ćwiczeń, zachowując strukturę treningiTygodnia i pozostałe dni nienaruszone...
  }
}

3. Jeśli użytkownik zgłasza spożyty posiłek lub produkt (np. "zjadłem jabłko", "wpadło 200g piersi z kurczaka z ryżem"):
{
  "typAkcji": "DODAJ_POSILEK",
  "odpowiedz": "Krótkie potwierdzenie dodania posiłku z wyliczonym makro.",
  "nowyPosilek": {
    "nazwa": "Precyzyjna nazwa potrawy z gramaturą",
    "kalorie": 180,
    "bialko": 4.5,
    "weglowodany": 38.0,
    "tluszcze": 1.2
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
          temperature: 0.2
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