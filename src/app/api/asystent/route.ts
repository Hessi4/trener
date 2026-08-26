// src/app/api/asystent/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Zezwala na dłuższy czas wykonania na serwerze

export async function POST(req: Request) {
  try {
    const profil = await req.json();
    
    // Klucz API po stronie serwera
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ error: "Brak klucza API GEMINI_API_KEY w zmiennych środowiskowych." }, { status: 500 });
    }

    const promptSystemowy = `
Jesteś elitarnym trenerem personalnym i dietetykiem klinicznym. Masz za zadanie ułożyć kompletny, spersonalizowany plan na 7 dni w formacie JSON.

DANE FIZYCZNE I BIOMECHANIKA:
- Płeć: ${profil.plec}
- Wiek: ${profil.wiek} lat
- Wzrost: ${profil.wzrostCm} cm
- Waga aktualna: ${profil.wagaAktualnaKg} kg -> Waga docelowa: ${profil.wagaDocelowaKg} kg
- Cel główny: ${profil.celGlowny}
- Poziom aktywności (poza treningami): ${profil.poziomAktywnosci}
- Urazy i problemy zdrowotne: "${profil.zdrowieIKontuzje || 'Brak'}"

HARMONOGRAM TRENINGOWY (ZAKAZ ZMIENIANIA!):
Musisz ułożyć treningi DOKŁADNIE w te dni i w takiej formie, jak zażyczył sobie użytkownik poniżej. Jeśli użytkownik ma "Wolne", zaplanuj tam "Regeneracja".
${profil.harmonogram ? profil.harmonogram.map((d: any) => `- ${d.dzienTygodnia}: ${d.rodzajTreningu}`).join('\n') : 'Brak wytycznych - rozłóż standardowo.'}

DOSTĘPNY SPRZĘT NA SIŁOWNI:
- Lista sprzętu: ${JSON.stringify(profil.sprzet || [])}
- Maksymalna waga hantli: ${profil.szczegolySilowni?.maksHantleKg || 0} kg
- Maksymalne obciążenie na gryf: ${profil.szczegolySilowni?.maksObciazenieGryfKg || 0} kg
*UWAGA: Rozpisując trening "Siłownia", używaj TYLKO ćwiczeń na sprzęt z powyższej listy.*

PARAMETRY BASENU (jeśli w harmonogramie jest "Basen"):
- Poziom: ${profil.basen?.poziom || 'Brak danych'}
- Opanowane style: ${JSON.stringify(profil.basen?.znaneStyle || [])}
- Dostępne akcesoria: ${JSON.stringify(profil.basen?.akcesoria || [])}
- Tempo komfortowe (100m): ${profil.basen?.tempo100mKraulKomfort || 'Nie określono'}
- Średnia objętość sesji: ${profil.basen?.sredniaObjetoscSesjiMetry || 0} m

TWOJE ZADANIE:
1. Oblicz całkowite zapotrzebowanie kaloryczne (TDEE) uwzględniając płeć, wiek, wagę, wzrost i poziom aktywności.
2. Skoryguj kalorie pod cel (np. deficyt dla redukcji, nadwyżka dla budowy masy).
3. Oblicz makroskładniki (białko, tłuszcze, węglowodany).
4. Ułóż 7-dniowy plan ćwiczeń, ściśle trzymając się Harmonogramu Treningowego.

ZWRÓĆ WYŁĄCZNIE POPRAWNY OBIEKT JSON WG TEGO SCHEMATU:
{
  "makroskladniki": {
    "kalorieKcal": 2250,
    "bialkoGramy": 170,
    "weglowodanyGramy": 240,
    "tluszczeGramy": 70,
    "uzasadnienie": "Wyliczone TDEE to X kcal. Zastosowano deficyt Y kcal ze względu na..."
  },
  "treningiTygodnia": [
    {
      "dzienTygodnia": "Poniedziałek",
      "typ": "Siłownia",
      "tytul": "Góra ciała",
      "akcent": "Hipertrofia",
      "cwiczeniaIZadania": [
        { "nazwa": "Wyciskanie hantli", "opisSerii": "4x8-10", "uwagiTechniczne": "Kontrolowane opuszczanie 3 sekundy" }
      ]
    }
  ]
}
`;

    // Endpoint v1beta z modelem gemini-3.6-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptSystemowy }] }],
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

    let jsonString = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jsonString) {
      throw new Error("Pusta odpowiedź z modelu AI.");
    }

    // Bezpieczne czyszczenie ewentualnych znaczników markdown
    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

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