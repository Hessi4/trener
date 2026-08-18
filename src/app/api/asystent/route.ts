// src/app/api/asystent/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profil = await req.json();
    
    // Twój klucz API Google Gemini
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const promptSystemowy = `
Jesteś elitarnym trenerem personalnym i dietetykiem. Masz za zadanie ułożyć kompletny plan na 7 dni w formacie JSON.

DANE UŻYTKOWNIKA:
- Sprzęt w garażu: ${JSON.stringify(profil.sprzet)}
- Maks hantle: ${profil.szczegolySilowni?.maksHantleKg}kg
- Urazy/Zdrowie: "${profil.zdrowieIKontuzje}"
- Basen objętość: ${profil.basen.sredniaObjetoscSesjiMetry}m, akcesoria: ${JSON.stringify(profil.basen.akcesoria)}
- Cel: ${profil.celGlowny}, Waga: ${profil.wagaAktualnaKg}kg -> Cel: ${profil.wagaDocelowaKg}kg

ZWRÓĆ WYŁĄCZNIE POPRAWNY OBIEKT JSON WG TEGO SCHEMATU:
{
  "makroskladniki": {
    "kalorieKcal": 2250,
    "bialkoGramy": 170,
    "weglowodanyGramy": 240,
    "tluszczeGramy": 70,
    "uzasadnienie": "Krótkie uzasadnienie diety."
  },
  "treningiTygodnia": [
    {
      "dzienTygodnia": "Poniedziałek",
      "typ": "Basen",
      "tytul": "Baza tlenowa",
      "akcent": "Technika",
      "cwiczeniaIZadania": [
        { "nazwa": "Rozgrzewka", "opisSerii": "4x50m kraul", "uwagiTechniczne": "Spokojne tempo" }
      ]
    }
  ]
}
`;

    // Używamy nowiutkiego modelu gemini-3.6-flash, zgodnie z zaleceniem serwerów Google
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: promptSystemowy }]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Błąd Google API:", data);
      throw new Error(data.error?.message || "Błąd komunikacji z API Google.");
    }

    const jsonString = data.candidates[0].content.parts[0].text;
    const wygenerowanyPlan = JSON.parse(jsonString);

    return Response.json(wygenerowanyPlan);

  } catch (error: any) {
    console.error('Błąd Backend:', error);
    return Response.json(
      { error: error?.message || 'Wystąpił problem z generowaniem planu.' },
      { status: 500 }
    );
  }
}