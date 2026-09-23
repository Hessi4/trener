// src/app/api/asystent/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { authorizeAiRequest, jsonError, readJsonObject } from '@/app/lib/api-auth';

// Awaryjny Groq (uruchamia się tylko w razie problemów z Gemini)
async function generujPlanGroq(prompt: string) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) throw new Error("Brak klucza GROQ_API_KEY.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Jesteś elitarnym trenerem personalnym i dietetykiem klinicznym. Zwracasz WYŁĄCZNIE poprawny obiekt JSON wg wskazanego schematu."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Błąd API Groq.");
  return data.choices?.[0]?.message?.content;
}

// Główne wywołanie Twojego Gemini 3.6 Flash
async function generujPlanGemini(prompt: string, apiKey: string) {
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
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

export async function POST(req: Request) {
  try {
    const authorization = await authorizeAiRequest(req);
    if (authorization instanceof Response) return authorization;
    const profil = await readJsonObject(req);
    if (!profil) return jsonError('Nieprawidłowe dane ankiety.', 400);
    const harmonogram = Array.isArray(profil.harmonogram) ? profil.harmonogram : [];
    const silownia = profil.szczegolySilowni && typeof profil.szczegolySilowni === 'object'
      ? profil.szczegolySilowni as Record<string, unknown>
      : {};
    const basen = profil.basen && typeof profil.basen === 'object'
      ? profil.basen as Record<string, unknown>
      : {};
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const harmonogramTekst = harmonogram.length > 0 
      ? harmonogram.map((d: any) => `- ${d?.dzienTygodnia || ''}: ${d?.rodzajTreningu || ''}`).join('\n')
      : 'Brak wytycznych - rozłóż standardowo.';

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
${harmonogramTekst}

DOSTĘPNY SPRZĘT NA SIŁOWNI:
- Lista sprzętu: ${JSON.stringify(profil.sprzet || [])}
- Maksymalna waga hantli: ${silownia.maksHantleKg || 0} kg
- Maksymalne obciążenie na gryf: ${silownia.maksObciazenieGryfKg || 0} kg
*UWAGA: Rozpisując trening "Siłownia", używaj TYLKO ćwiczeń na sprzęt z powyższej listy.*

PARAMETRY BASENU (jeśli w harmonogramie jest "Basen"):
- Poziom: ${basen.poziom || 'Brak danych'}
- Opanowane style: ${JSON.stringify(basen.znaneStyle || [])}
- Dostępne akcesoria: ${JSON.stringify(basen.akcesoria || [])}
- Tempo komfortowe (100m): ${basen.tempo100mKraulKomfort || 'Nie określono'}
- Średnia objętość sesji: ${basen.sredniaObjetoscSesjiMetry || 0} m

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

    let jsonString: string | undefined;

    // Próba 1: Gemini 3.6 Flash
    if (apiKey) {
      try {
        jsonString = await generujPlanGemini(promptSystemowy, apiKey);
      } catch (geminiError: any) {
        console.warn("Gemini 3.6 zgłosiło błąd przy generowaniu planu. Przełączam na Groq:", geminiError.message);
      }
    }

    // Próba 2: Groq jako awaryjny fallback
    if (!jsonString) {
      try {
        jsonString = await generujPlanGroq(promptSystemowy);
      } catch (groqError: any) {
        throw new Error(`Oba systemy AI zawiodły: ${groqError.message}`);
      }
    }

    if (!jsonString) {
      throw new Error("Pusta odpowiedź z modelu AI.");
    }

    if (jsonString.includes('```json')) {
      jsonString = jsonString.split('```json')[1].split('```')[0].trim();
    } else if (jsonString.includes('```')) {
      jsonString = jsonString.split('```')[1].split('```')[0].trim();
    }

    const match = jsonString.match(/\{[\s\S]*\}/);
    if (match) jsonString = match[0];

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