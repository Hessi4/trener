// src/app/dziennik/page.tsx
"use client";

import React, { useState, useEffect } from 'react';

export default function DziennikPage() {
  const [plan, setPlan] = useState<any>(null);
  
  // Stan treningów siłowych
  const [wybranyDzienIdx, setWybranyDzienIdx] = useState<number>(0);
  const [wybraneCwiczenie, setWybraneCwiczenie] = useState('');
  const [ciezar, setCiezar] = useState('');
  const [powtorzenia, setPowtorzenia] = useState('');
  const [treningiZapis, setTreningiZapis] = useState<any[]>([]);

  // Posiłki
  const [posilki, setPosilki] = useState<any[]>([]);
  const [nazwaPosilku, setNazwaPosilku] = useState('');
  const [kalorie, setKalorie] = useState('');

  useEffect(() => {
    const zapisanyPlan = localStorage.getItem('wygenerowany_plan_ai');
    if (zapisanyPlan) {
      setPlan(JSON.parse(zapisanyPlan));
    }

    const zapisaneTreningi = localStorage.getItem('moje_treningi_dzis');
    if (zapisaneTreningi) setTreningiZapis(JSON.parse(zapisaneTreningi));

    const zapisanePosilki = localStorage.getItem('moje_posilki_dzis');
    if (zapisanePosilki) setPosilki(JSON.parse(zapisanePosilki));
  }, []);

  // Znajdź ostatni wynik dla konkretnego ćwiczenia (żeby widzieć "ile robiłem ostatnio")
  const znajdzOstatniWynik = (nazwaCwiczenia: string) => {
    const ostatni = treningiZapis.slice().reverse().find(t => t.cwiczenie === nazwaCwiczenia);
    if (!ostatni) return "Brak historii (zrób pierwszy zapis!)";
    return `Ostatnio: ${ostatni.ciezar} kg (${ostatni.powtorzenia} powt.)`;
  };

  // Zapisz wykonane ćwiczenie z planu
  const zapiszWynikTreningu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wybraneCwiczenie || !ciezar || !powtorzenia) return;

    const nowyWynik = {
      id: Date.now(),
      cwiczenie: wybraneCwiczenie,
      ciezar: Number(ciezar) || 0,
      powtorzenia,
      data: new Date().toLocaleDateString()
    };

    const zaktualizowane = [...treningiZapis, nowyWynik];
    setTreningiZapis(zaktualizowane);
    localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));

    // Reset pól ciężaru, zostawiamy wybrane ćwiczenie
    setCiezar('');
    setPowtorzenia('');
  };

  const usunWynik = (id: number) => {
    const zaktualizowane = treningiZapis.filter(t => t.id !== id);
    setTreningiZapis(zaktualizowane);
    localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));
  };

  // Wyciągamy dni treningowe z planu AI (jeśli istnieją)
  const dniTreningowe = plan?.treningiTygodnia || [];
  const aktualnyDzienObj = dniTreningowe[wybranyDzienIdx];

  // Kalorie
  const sumaKcal = posilki.reduce((acc, curr) => acc + curr.kalorie, 0);
  const celKcal = plan?.makroskladniki?.kalorieKcal || 2250;
  const zostaloKcal = celKcal - sumaKcal;

  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen bg-zinc-950 space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-emerald-400 text-center">Dziennik Treningowy z Planu AI</h1>

      {/* KALORIE */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <p className="text-xs text-zinc-400 uppercase">Bilans Kalorii</p>
          <p className="text-xl font-black text-white">{sumaKcal} / {celKcal} <span className="text-xs text-zinc-400 font-normal">kcal</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 uppercase">Pozostało</p>
          <p className={`text-xl font-black ${zostaloKcal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{zostaloKcal} kcal</p>
        </div>
      </div>

      {/* SEKCJA TRENINGU Z PLANU */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-emerald-400">📋 Wybierz trening z Twojego planu</h2>
        
        {dniTreningowe.length === 0 ? (
          <p className="text-zinc-400 text-sm">Brak zapisanego planu AI. Wygeneruj najpierw plan w ankiecie!</p>
        ) : (
          <div className="space-y-4">
            {/* Wybór dnia tygodnia */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dniTreningowe.map((dzien: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setWybranyDzienIdx(idx);
                    setWybraneCwiczenie(''); // Reset wybranego ćwiczenia przy zmianie dnia
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${wybranyDzienIdx === idx ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  {dzien.dzienTygodnia} ({dzien.typ})
                </button>
              ))}
            </div>

            {/* Wyświetlanie szczegółów wybranego dnia */}
            {aktualnyDzienObj && (
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div>
                  <h3 className="font-bold text-white text-base">{aktualnyDzienObj.tytul} <span className="text-xs text-emerald-400 font-normal">({aktualnyDzienObj.akcent})</span></h3>
                  <p className="text-xs text-zinc-400">Kliknij ćwiczenie z planu, aby zapisać swój wynik:</p>
                </div>

                {/* Lista ćwiczeń z planu na ten dzień */}
                <div className="space-y-2">
                  {aktualnyDzienObj.cwiczeniaIZadania?.map((cw: any, cIdx: number) => {
                    const isSelected = wybraneCwiczenie === cw.nazwa;
                    const ostatniStatus = znajdzOstatniWynik(cw.nazwa);

                    return (
                      <div 
                        key={cIdx}
                        onClick={() => setWybraneCwiczenie(cw.nazwa)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${isSelected ? 'bg-emerald-950/40 border-emerald-500 shadow' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-sm">{cw.nazwa}</span>
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">Plan: {cw.opisSerii}</span>
                        </div>
                        <p className="text-xs text-emerald-400 font-medium">{ostatniStatus}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Formularz wpisywania ciężaru dla wybranego ćwiczenia */}
                {wybraneCwiczenie && (
                  <form onSubmit={zapiszWynikTreningu} className="bg-zinc-900 p-4 rounded-xl border border-emerald-500/50 space-y-3 mt-4 animate-fadeIn">
                    <p className="text-sm font-bold text-white">Zapisujesz wynik dla: <span className="text-emerald-400">{wybraneCwiczenie}</span></p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Ciężar (kg)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={ciezar} 
                          onChange={(e) => setCiezar(e.target.value)}
                          placeholder="np. 72.5"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Powtórzenia w seriach</label>
                        <input 
                          type="text" 
                          value={powtorzenia} 
                          onChange={(e) => setPowtorzenia(e.target.value)}
                          placeholder="np. 8, 8, 7"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-sm transition shadow"
                    >
                      Zapisz wynik serii
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ostatnio zapisane wyniki dzisiaj */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Zapisane serie z dzisiejszego treningu:</h3>
          {treningiZapis.length === 0 ? (
            <p className="text-zinc-500 text-xs text-center py-3 bg-zinc-950/40 rounded-xl border border-zinc-800/50">Brak zapisanych wyników.</p>
          ) : (
            treningiZapis.map((t) => (
              <div key={t.id} className="bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-white">{t.cwiczenie}</p>
                  <p className="text-xs text-zinc-400">Powtórzenia: {t.powtorzenia} • {t.data}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-emerald-400">{t.ciezar} kg</span>
                  <button onClick={() => usunWynik(t.id)} className="text-zinc-500 hover:text-red-400 font-bold px-1">✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SZYBKI DODATEK POSIŁKU */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-3">
        <h2 className="text-base font-bold text-white">🥗 Szybki posiłek</h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={nazwaPosilku} 
            onChange={(e) => setNazwaPosilku(e.target.value)}
            placeholder="Nazwa posiłku" 
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
          />
          <input 
            type="number" 
            value={kalorie} 
            onChange={(e) => setKalorie(e.target.value)}
            placeholder="kcal" 
            className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
          />
          <button 
            onClick={() => {
              if(!nazwaPosilku || !kalorie) return;
              const nowy = { id: Date.now(), nazwa: nazwaPosilku, kalorie: Number(kalorie) };
              const update = [...posilki, nowy];
              setPosilki(update);
              localStorage.setItem('moje_posilki_dzis', JSON.stringify(update));
              setNazwaPosilku(''); setKalorie('');
            }}
            className="bg-emerald-600 px-4 rounded-lg font-bold text-sm"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}