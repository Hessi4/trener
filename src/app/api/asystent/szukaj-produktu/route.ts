// src/app/api/asystent/szukaj-produktu/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { nazwaProduktu } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) return Response.json({ error: "Brak klucza API." }, { status: 500 });

    // ULEPSZONY PROMPT - dostosowuje się do zapytania!
    const prompt = `Jesteś zaawansowaną wyszukiwarką dietetyczną.
Zadanie: Użytkownik szuka hasła: "${nazwaProduktu}".

Wypisz od 2 do 8 RZECZYWISTYCH wariantów tego produktu. 
- Jeśli użytkownik wpisał ogólne hasło (np. "mleko"), podaj różne zawartości tłuszczu i popularne marki (Biedronka, Lidl, Łaciate).
- Jeśli użytkownik podał konkretną markę i smak (np. "Tymbark jabłko"), wypisz wszystkie znane kombinacje tego smaku (np. Jabłko-Mięta, Jabłko-Brzoskwinia, Jabłko-Arbuz, itp.).

Zwróć TYLKO kod JSON w postaci tablicy (zaczyna się od znaku '[' a kończy na ']'). Nie dodawaj żadnych słów wstępu.
Zastosuj poniższy schemat dla każdego wariantu:

[
  {
    "nazwa": "Pełna nazwa wariantu (np. Tymbark Jabłko-Mięta)",
    "marka": "Nazwa marki lub sklepu",
    "kalorieNa100g": 42,
    "bialkoNa100g": 0.1,
    "weglowodanyNa100g": 10,
    "tluszczeNa100g": 0
  }
]`;

    // TWÓJ SPRAWDZONY LINK
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=' + apiKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        // Temperatura 0.4 sprawi, że model skupi się na prawdziwych produktach, a nie na fantazjowaniu
        generationConfig: { temperature: 0.4 } 
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error?.message || "Odrzucono zapytanie przez Google API.");
    }
    
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("API Google nie zwróciło żadnego tekstu.");
    }

    let jsonString = data.candidates[0].content.parts[0].text;
    
    // Zabezpieczenie brutalnie wyciągające tablicę JSON
    const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonString = arrayMatch[0];
    }

    try {
      let parsedData = JSON.parse(jsonString);
      
      if (parsedData.warianty) parsedData = parsedData.warianty;
      if (!Array.isArray(parsedData)) parsedData = [parsedData];
  
      return Response.json(parsedData);
    } catch (parseError) {
      throw new Error("AI popsuło formatowanie JSON: " + jsonString.substring(0, 30) + "...");
    }

  } catch (error: any) {
    return Response.json({ error: error?.message || 'Nieznany błąd serwera.' }, { status: 500 });
  }
}