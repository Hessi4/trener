// src/app/edytor-planu/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EdytorPlanuPage() {
  const [plan, setPlan] = useState<any>(null);
  
  // Stany do dodawania nowego dnia
  const [nowyDzienTytul, setNowyDzienTytul] = useState('');
  const [nowyDzienTyp, setNowyDzienTyp] = useState('Siłownia');
  const [nowyDzienDzienTygodnia, setNowyDzienDzienTygodnia] = useState('Poniedziałek');
  
  // Stany dla wybranego dnia
  const [wybranyIdx, setWybranyIdx] = useState<number>(0);
  const [nowaNazwaCwiczenia, setNowaNazwaCwiczenia] = useState('');
  const [nowyOpisSerii, setNowyOpisSerii] = useState('3x10');
  
  // Stan edycji konkretnego ćwiczenia (-1 oznacza dodawanie nowego)
  const [edytowaneCwiczenieIdx, setEdytowaneCwiczenieIdx] = useState<number | null>(null);

  const [ladujeAi, setLadujeAi] = useState(false);

  useEffect(() => {
    const zapisanyPlan = localStorage.getItem('wygenerowany_plan_ai');
    if (zapisanyPlan) {
      setPlan(JSON.parse(zapisanyPlan));
    } else {
      setPlan({
        makroskladniki: { kalorieKcal: 2250, bialkoGramy: 170, weglowodanyGramy: 240, tluszczeGramy: 70 },
        treningiTygodnia: []
      });
    }
  }, []);

  const zapiszZmiany = (zaktualizowanyPlan: any) => {
    setPlan(zaktualizowanyPlan);
    localStorage.setItem('wygenerowany_plan_ai', JSON.stringify(zaktualizowanyPlan));
  };

  const dodajDzien = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nowyDzienTytul) return;

    const nowyDzienObj = {
      dzienTygodnia: nowyDzienDzienTygodnia,
      typ: nowyDzienTyp,
      tytul: nowyDzienTytul,
      akcent: "Własny",
      cwiczeniaIZadania: []
    };

    const zaktualizowaneDni = [...(plan.treningiTygodnia || []), nowyDzienObj];
    zapiszZmiany({ ...plan, treningiTygodnia: zaktualizowaneDni });
    setNowyDzienTytul('');
    setWybranyIdx(zaktualizowaneDni.length - 1);
  };

  const usunDzien = (idx: number) => {
    const zaktualizowaneDni = plan.treningiTygodnia.filter((_: any, i: number) => i !== idx);
    zapiszZmiany({ ...plan, treningiTygodnia: zaktualizowaneDni });
    if (wybranyIdx >= zaktualizowaneDni.length) {
      setWybranyIdx(Math.max(0, zaktualizowaneDni.length - 1));
    }
  };

  // Dodawanie lub edycja ćwiczenia
  const zapiszCwiczenie = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nowaNazwaCwiczenia || plan.treningiTygodnia.length === 0) return;

    const dni = [...plan.treningiTygodnia];
    const wybranek = dni[wybranyIdx];

    if (!wybranek.cwiczeniaIZadania) {
      wybranek.cwiczeniaIZadania = [];
    }

    if (edytowaneCwiczenieIdx !== null) {
      // Edycja istniejącego
      wybranek.cwiczeniaIZadania[edytowaneCwiczenieIdx] = {
        ...wybranek.cwiczeniaIZadania[edytowaneCwiczenieIdx],
        nazwa: nowaNazwaCwiczenia,
        opisSerii: nowyOpisSerii
      };
      setEdytowaneCwiczenieIdx(null);
    } else {
      // Dodawanie nowego
      wybranek.cwiczeniaIZadania.push({
        nazwa: nowaNazwaCwiczenia,
        opisSerii: nowyOpisSerii,
        uwagiTechniczne: "Własne zadanie"
      });
    }

    zapiszZmiany({ ...plan, treningiTygodnia: dni });
    setNowaNazwaCwiczenia('');
    setNowyOpisSerii('3x10');
  };

  // Wczytaj dane do formularza w celu edycji
  const rozpocznijEdycje = (cIdx: number) => {
    const cw = plan.treningiTygodnia[wybranyIdx].cwiczeniaIZadania[cIdx];
    setNowaNazwaCwiczenia(cw.nazwa);
    setNowyOpisSerii(cw.opisSerii || '3x10');
    setEdytowaneCwiczenieIdx(cIdx);
  };

  const usunCwiczenie = (cIdx: number) => {
    const dni = [...plan.treningiTygodnia];
    dni[wybranyIdx].cwiczeniaIZadania.splice(cIdx, 1);
    zapiszZmiany({ ...plan, treningiTygodnia: dni });
    if (edytowaneCwiczenieIdx === cIdx) {
      setEdytowaneCwiczenieIdx(null);
      setNowaNazwaCwiczenia('');
      setNowyOpisSerii('3x10');
    }
  };

  // Generator AI dla pojedynczego dnia
  const generujDzienAIBezposrednio = async () => {
    const aktualny = plan.treningiTygodnia[wybranyIdx];
    if (!aktualny) return;

    setLadujeAi(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Brak klucza API. Upewnij się, że dodałeś NEXT_PUBLIC_GEMINI_API_KEY w ustawieniach (zmienne środowiskowe).");
      }

      const prompt = `Wygeneruj listę ćwiczeń dla dnia treningowego. 
Dzień: ${aktualny.dzienTygodnia}, Tytuł: ${aktualny.tytul}, Typ aktywności: ${aktualny.typ}.
Zwróć WYŁĄCZNIE poprawną tablicę JSON w formacie obiektów. NIE UŻYWAJ ZNACZNIKÓW MARKDOWN. Sam czysty tekst. Format:
[
  { "nazwa": "Nazwa ćwiczenia lub zadania", "opisSerii": "np. 4x10 lub 8x100m", "uwagiTechniczne": "krótka wskazówka" }
]`;

      // Poprawiony URL z v1 na v1beta (naprawia błąd 404)
      const url = '[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=)' + apiKey;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
        })
      });

      if (!response.ok) {
        throw new Error(`Błąd połączenia z API (kod ${response.status})`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
          throw new Error("AI nie zwróciło poprawnej odpowiedzi.");
      }

      let jsonString = data.candidates[0].content.parts[0].text;
      
      // Bezpieczne czyszczenie z markdowna (naprawia błąd w VS Code)
      jsonString = jsonString.replace(/`{3}json/gi, "").replace(/`{3}/g, "").trim();

      const wygenerowaneCwiczenia = JSON.parse(jsonString);

      const dni = [...plan.treningiTygodnia];
      dni[wybranyIdx].cwiczeniaIZadania = wygenerowaneCwiczenia;
      zapiszZmiany({ ...plan, treningiTygodnia: dni });
    } catch (err: any) {
      console.error("Szczegóły błędu AI:", err);
      alert(`Nie udało się wygenerować planu: ${err.message}`);
    } finally {
      setLadujeAi(false);
    }
  };

  if (!plan) return <div className="p-6 text-white bg-zinc-950 min-h-screen">Ładowanie edytora...</div>;

  const aktualnyDzien = plan.treningiTygodnia[wybranyIdx];

  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen bg-zinc-950 space-y-6 pb-16">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Edytor Własnego Planu</h1>
          <p className="text-xs text-zinc-400">Modyfikuj, edytuj i dopasowuj plan do siebie</p>
        </div>
        <Link className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow" href="/">
          ← Powrót do Pulpitu
        </Link>
      </div>

      {/* DODAJ NOWY DZIEŃ */}
      <form onSubmit={dodajDzien} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Dodaj nowy dzień do planu</h2>
        <div className="grid grid-cols-3 gap-2">
          <input 
            type="text" value={nowyDzienDzienTygodnia} onChange={(e) => setNowyDzienDzienTygodnia(e.target.value)}
            placeholder="Dzień (np. Wtorek)" className="bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
          />
          <input 
            type="text" value={nowyDzienTytul} onChange={(e) => setNowyDzienTytul(e.target.value)}
            placeholder="Tytuł" className="bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
          />
          <select 
            value={nowyDzienTyp} onChange={(e) => setNowyDzienTyp(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
          >
            <option value="Siłownia">Siłownia</option>
            <option value="Basen">Basen</option>
            <option value="Cardio">Cardio / Rower</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition">
          + Utwórz dzień treningowy
        </button>
      </form>

      {/* LISTA DNI */}
      {plan.treningiTygodnia.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Wybierz dzień do edycji:</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {plan.treningiTygodnia.map((d: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1">
                <button
                  onClick={() => { setWybranyIdx(idx); setEdytowaneCwiczenieIdx(null); setNowaNazwaCwiczenia(''); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${wybranyIdx === idx ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  {d.dzienTygodnia}: {d.tytul} ({d.typ})
                </button>
                <button onClick={() => usunDzien(idx)} className="text-zinc-500 hover:text-red-400 text-xs px-1">✕</button>
              </div>
            ))}
          </div>

          {/* EDYCJA WYBRANEGO DNIA */}
          {aktualnyDzien && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm">Edytujesz: <span className="text-emerald-400">{aktualnyDzien.dzienTygodnia} - {aktualnyDzien.tytul}</span></h3>
                  <p className="text-xs text-zinc-400">Typ: <b>{aktualnyDzien.typ}</b></p>
                </div>
                <button 
                  onClick={generujDzienAIBezposrednio}
                  disabled={ladujeAi}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1 disabled:opacity-50"
                >
                  {ladujeAi ? "🤖 AI układa plan..." : "🤖 Wygeneruj plan AI dla tego dnia"}
                </button>
              </div>

              {/* Formularz dodawania / edycji ćwiczenia */}
              <form onSubmit={zapiszCwiczenie} className="space-y-3 bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-zinc-300">
                    {edytowaneCwiczenieIdx !== null ? "✏️ Edytujesz wybrane ćwiczenie:" : "➕ Dodaj nowe ćwiczenie:"}
                  </p>
                  {edytowaneCwiczenieIdx !== null && (
                    <button 
                      type="button" 
                      onClick={() => { setEdytowaneCwiczenieIdx(null); setNowaNazwaCwiczenia(''); setNowyOpisSerii('3x10'); }}
                      className="text-[10px] text-zinc-400 hover:text-white underline"
                    >
                      Anuluj edycję
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input 
                    type="text" value={nowaNazwaCwiczenia} onChange={(e) => setNowaNazwaCwiczenia(e.target.value)}
                    placeholder="Nazwa" className="col-span-2 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white" required
                  />
                  <input 
                    type="text" value={nowyOpisSerii} onChange={(e) => setNowyOpisSerii(e.target.value)}
                    placeholder="Plan (np. 3x10)" className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white" required
                  />
                </div>
                <button type="submit" className={`w-full font-bold py-2 rounded-lg text-xs transition ${edytowaneCwiczenieIdx !== null ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'}`}>
                  {edytowaneCwiczenieIdx !== null ? "Zapisz zmiany w ćwiczeniu" : "Dodaj do tego dnia"}
                </button>
              </form>

              {/* Lista ćwiczeń z przyciskami Edytuj oraz Usuń */}
              <div className="space-y-2">
                {(!aktualnyDzien.cwiczeniaIZadania || aktualnyDzien.cwiczeniaIZadania.length === 0) ? (
                  <p className="text-zinc-500 text-xs text-center py-2">Brak pozycji w tym dniu.</p>
                ) : (
                  aktualnyDzien.cwiczeniaIZadania.map((cw: any, cIdx: number) => (
                    <div key={cIdx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{cw.nazwa}</p>
                        <p className="text-[10px] text-zinc-400">Zalecenie: {cw.opisSerii}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => rozpocznijEdycje(cIdx)} 
                          className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium px-2.5 py-1 rounded-lg transition"
                        >
                          Edytuj
                        </button>
                        <button 
                          onClick={() => usunCwiczenie(cIdx)} 
                          className="text-zinc-500 hover:text-red-400 font-bold px-2 py-1 transition"
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}