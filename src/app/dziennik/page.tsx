// src/app/dziennik/page.tsx
"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/app/lib/supabase';

export default function DziennikPage() {
  const [plan, setPlan] = useState<any>(null);
  const [ladowanie, setLadowanie] = useState(true);

  // Treningi
  const [wybranyDzienIdx, setWybranyDzienIdx] = useState<number>(0);
  const [wybraneCwiczenie, setWybraneCwiczenie] = useState('');
  const [ciezar, setCiezar] = useState('');
  const [powtorzenia, setPowtorzenia] = useState('');
  const [treningiZapis, setTreningiZapis] = useState<any[]>([]);

  // Posiłki
  const [posilki, setPosilki] = useState<any[]>([]);
  const [nazwaPosilku, setNazwaPosilku] = useState('');
  const [kalorie, setKalorie] = useState('');

  const dzisiejszaData = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function wczytajWszystko() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 1. Pobranie planu użytkownika z Supabase
          const { data: dbPlan } = await supabase
            .from('plany')
            .select('dane_planu')
            .eq('user_id', user.id)
            .maybeSingle();

          if (dbPlan?.dane_planu) {
            setPlan(dbPlan.dane_planu);
          } else {
            const localPlan = localStorage.getItem('wygenerowany_plan_ai');
            if (localPlan) setPlan(JSON.parse(localPlan));
          }

          // 2. Pobranie historii treningów dla zalogowanego użytkownika
          const { data: dbTreningi } = await supabase
            .from('treningi')
            .select('*')
            .eq('user_id', user.id)
            .order('id', { ascending: false });

          if (dbTreningi) {
            setTreningiZapis(dbTreningi);
          }

          // 3. Pobranie posiłków z dzisiejszego dnia dla zalogowanego użytkownika
          const { data: dbPosilki } = await supabase
            .from('posilki')
            .select('*')
            .eq('user_id', user.id)
            .eq('data', dzisiejszaData);

          if (dbPosilki) {
            setPosilki(dbPosilki);
          }
        } else {
          // Fallback lokalny w razie braku sesji
          const localPlan = localStorage.getItem('wygenerowany_plan_ai');
          if (localPlan) setPlan(JSON.parse(localPlan));
          const localTreningi = localStorage.getItem('moje_treningi_dzis');
          if (localTreningi) setTreningiZapis(JSON.parse(localTreningi));
          const localPosilki = localStorage.getItem('moje_posilki_dzis');
          if (localPosilki) setPosilki(JSON.parse(localPosilki));
        }
      } catch (err) {
        console.error('Błąd ładowania danych dziennika:', err);
      } finally {
        setLadowanie(false);
      }
    }

    wczytajWszystko();
  }, [dzisiejszaData]);

  // Wyszukiwanie ostatniego zapisanego wyniku dla danego ćwiczenia
  const znajdzOstatniWynik = (nazwaCwiczenia: string) => {
    const ostatni = treningiZapis.find(t => t.cwiczenie === nazwaCwiczenia);
    if (!ostatni) return "Brak historii (zrób pierwszy zapis!)";
    const ciezarVal = ostatni.typ || (ostatni.serie?.[0]?.ciezar) || ostatni.ciezar || 0;
    const powtVal = ostatni.podsumowanie || (ostatni.serie?.[0]?.powtorzenia) || ostatni.powtorzenia || '-';
    return `Ostatnio: ${ciezarVal} kg (${powtVal} powt.)`;
  };

  // Zapis serii treningowej
  const zapiszWynikTreningu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wybraneCwiczenie || !ciezar || !powtorzenia) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user ? user.id : 'anonim';

      const nowyWynik = {
        id: Date.now(),
        user_id: userId,
        cwiczenie: wybraneCwiczenie,
        typ: String(ciezar), // waga w polu typ lub strukturze
        serie: [{ ciezar: Number(ciezar), powtorzenia }],
        podsumowanie: String(powtorzenia),
        data: dzisiejszaData
      };

      const zaktualizowane = [nowyWynik, ...treningiZapis];
      setTreningiZapis(zaktualizowane);
      localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));

      if (user) {
        await supabase.from('treningi').insert([nowyWynik]);
      }

      setCiezar('');
      setPowtorzenia('');
    } catch (err) {
      console.error('Błąd zapisu serii treningowej:', err);
    }
  };

  const usunWynik = async (id: number) => {
    try {
      const zaktualizowane = treningiZapis.filter(t => t.id !== id);
      setTreningiZapis(zaktualizowane);
      localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));

      await supabase.from('treningi').delete().eq('id', id);
    } catch (err) {
      console.error('Błąd usuwania serii:', err);
    }
  };

  // Dodawanie posiłku
  const dodajSzybkiPosilek = async () => {
    if (!nazwaPosilku || !kalorie) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user ? user.id : 'anonim';

      const nowy = {
        id: Date.now(),
        user_id: userId,
        nazwa: nazwaPosilku,
        kalorie: Number(kalorie),
        bialko: 0,
        weglowodany: 0,
        tluszcze: 0,
        data: dzisiejszaData
      };

      const update = [...posilki, nowy];
      setPosilki(update);
      localStorage.setItem('moje_posilki_dzis', JSON.stringify(update));

      if (user) {
        await supabase.from('posilki').insert([nowy]);
      }

      setNazwaPosilku('');
      setKalorie('');
    } catch (err) {
      console.error('Błąd zapisu posiłku:', err);
    }
  };

  if (ladowanie) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-400">
        <p className="font-bold animate-pulse">Ładowanie dziennika...</p>
      </div>
    );
  }

  const dniTreningowe = plan?.treningiTygodnia || [];
  const aktualnyDzienObj = dniTreningowe[wybranyDzienIdx];

  const sumaKcal = posilki.reduce((acc, curr) => acc + (Number(curr.kalorie) || 0), 0);
  const celKcal = plan?.makroskladniki?.kalorieKcal || 2250;
  const zostaloKcal = celKcal - sumaKcal;

  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen bg-zinc-950 space-y-6 pb-16">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Dziennik Treningowy</h1>
          <p className="text-xs text-zinc-400">Zapisuj ciężary i kontroluj kalorie</p>
        </div>
        <Link className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow" href="/">
          ← Powrót do Pulpitu
        </Link>
      </div>

      {/* KALORIE */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl flex justify-between items-center">
        <div>
          <p className="text-xs text-zinc-400 uppercase">Bilans Kalorii (Dzisiaj)</p>
          <p className="text-xl font-black text-white">{sumaKcal} / {celKcal} <span className="text-xs text-zinc-400 font-normal">kcal</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-400 uppercase">Pozostało</p>
          <p className={`text-xl font-black ${zostaloKcal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{zostaloKcal} kcal</p>
        </div>
      </div>

      {/* SEKCJA TRENINGU Z PLANU */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
        <h2 className="text-base font-bold text-emerald-400">📋 Wybierz trening z Twojego planu</h2>
        
        {dniTreningowe.length === 0 ? (
          <p className="text-zinc-400 text-sm">Brak zapisanego planu AI. Wypełnij ankietę lub stwórz plan w Edytorze.</p>
        ) : (
          <div className="space-y-4">
            {/* Wybór dnia tygodnia */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dniTreningowe.map((dzien: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setWybranyDzienIdx(idx);
                    setWybraneCwiczenie('');
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
                  <h3 className="font-bold text-white text-sm">{aktualnyDzienObj.tytul} <span className="text-xs text-emerald-400 font-normal">({aktualnyDzienObj.akcent})</span></h3>
                  <p className="text-xs text-zinc-400">Kliknij ćwiczenie z planu, aby zapisać serie:</p>
                </div>

                {/* Lista ćwiczeń */}
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

                {/* Formularz wpisywania ciężaru */}
                {wybraneCwiczenie && (
                  <form onSubmit={zapiszWynikTreningu} className="bg-zinc-900 p-4 rounded-xl border border-emerald-500/50 space-y-3 mt-4">
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
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Powtórzenia</label>
                        <input 
                          type="text" 
                          value={powtorzenia} 
                          onChange={(e) => setPowtorzenia(e.target.value)}
                          placeholder="np. 10, 10, 8"
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

        {/* Zapisane serie */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Zapisane serie z historii:</h3>
          {treningiZapis.length === 0 ? (
            <p className="text-zinc-500 text-xs text-center py-3 bg-zinc-950/40 rounded-xl border border-zinc-800/50">Brak zapisanych wyników.</p>
          ) : (
            treningiZapis.slice(0, 10).map((t) => (
              <div key={t.id} className="bg-zinc-800/50 border border-zinc-700/50 p-3 rounded-xl flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-white">{t.cwiczenie}</p>
                  <p className="text-xs text-zinc-400">Powtórzenia: {t.podsumowanie || t.serie?.[0]?.powtorzenia || t.powtorzenia} • {t.data}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-emerald-400">{t.typ || t.serie?.[0]?.ciezar || t.ciezar} kg</span>
                  <button type="button" onClick={() => usunWynik(t.id)} className="text-zinc-500 hover:text-red-400 font-bold px-1">✕</button>
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
            type="button"
            onClick={dodajSzybkiPosilek}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-lg font-bold text-sm transition"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}