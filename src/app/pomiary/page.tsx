// src/app/pomiary/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PomiaryPage() {
  const [pomiary, setPomiary] = useState<any[]>([]);
  const [kategoria, setKategoria] = useState('Masa ciała');
  const [wartosc, setWartosc] = useState('');
  const [dataPomiaru, setDataPomiaru] = useState(new Date().toISOString().split('T')[0]);

  const kategorie = [
    'Masa ciała', 'Szyja/kark', 'Klatka piersiowa', 
    'Talia', 'Brzuch', 'Biodra', 'Udo', 'Łydka', 'Ramię/biceps'
  ];

  useEffect(() => {
    const zapisane = localStorage.getItem('historia_pomiarow_szczegolowa');
    if (zapisane) {
      setPomiary(JSON.parse(zapisane));
    } else {
      // Przykładowe dane startowe, żeby wykres od razu ładnie wyglądał
      const domyslne = [
        { id: 1, kategoria: 'Masa ciała', wartosc: 85, data: '2026-05-01' },
        { id: 2, kategoria: 'Masa ciała', wartosc: 84.2, data: '2026-06-01' },
        { id: 3, kategoria: 'Masa ciała', wartosc: 83.0, data: '2026-07-01' },
      ];
      setPomiary(domyslne);
      localStorage.setItem('historia_pomiarow_szczegolowa', JSON.stringify(domyslne));
    }
  }, []);

  const dodajPomiar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wartosc) return;

    const nowy = {
      id: Date.now(),
      kategoria,
      wartosc: Number(wartosc),
      data: dataPomiaru
    };

    const zaktualizowane = [...pomiary, nowy];
    setPomiary(zaktualizowane);
    localStorage.setItem('historia_pomiarow_szczegolowa', JSON.stringify(zaktualizowane));
    setWartosc('');
  };

  const usunPomiar = (id: number) => {
    const zaktualizowane = pomiary.filter(p => p.id !== id);
    setPomiary(zaktualizowane);
    localStorage.setItem('historia_pomiarow_szczegolowa', JSON.stringify(zaktualizowane));
  };

  // Filtrowanie pomiariów dla wybranej kategorii i sortowanie po dacie
  const przefiltrowane = pomiary
    .filter(p => p.kategoria === kategoria)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  // Obliczenia do prostego wykresu SVG
  const minVal = przefiltrowane.length > 0 ? Math.min(...przefiltrowane.map(p => p.wartosc)) - 2 : 0;
  const maxVal = przefiltrowane.length > 0 ? Math.max(...przefiltrowane.map(p => p.wartosc)) + 2 : 100;
  const range = maxVal - minVal || 1;

  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen bg-zinc-950 space-y-6 pb-16">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Pomiary ciała</h1>
          <p className="text-xs text-zinc-400">Śledź swój postęp tydzień po tygodniu</p>
        </div>
        <Link href="/" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow">
          ← Powrót do Pulpitu
        </Link>
      </div>

      {/* WYBÓR KATEGORII (CHIPSY) */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-3">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Wybierz partię / pomiar:</p>
        <div className="flex flex-wrap gap-2">
          {kategorie.map((kat) => (
            <button
              key={kat}
              onClick={() => setKategoria(kat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${kategoria === kat ? 'bg-emerald-500 text-black shadow' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              {kat}
            </button>
          ))}
        </div>
      </div>

      {/* WYKRES WIZUALNY (SVG) */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">Wykres: <span className="text-emerald-400">{kategoria}</span></h2>
          <span className="text-xs text-zinc-400">{przefiltrowane.length} wpisów</span>
        </div>

        {przefiltrowane.length < 2 ? (
          <div className="h-48 flex items-center justify-center text-zinc-500 text-xs text-center border border-dashed border-zinc-800 rounded-xl">
            Dodaj przynajmniej 2 pomiary w tej kategorii, aby zobaczyć linię wykresu.
          </div>
        ) : (
          <div className="relative h-52 w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
            {/* SVG Line Chart */}
            <svg className="absolute inset-0 w-full h-full p-6 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Linia wykresu */}
              <path
                d={przefiltrowane.reduce((acc, p, i) => {
                  const x = (i / (przefiltrowane.length - 1)) * 100;
                  const y = 100 - ((p.wartosc - minVal) / range) * 100;
                  return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, "")}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>

            {/* Punkty na wykresie */}
            <div className="absolute inset-0 p-6 flex justify-between pointer-events-none">
              {przefiltrowane.map((p, i) => {
                const x = (i / (przefiltrowane.length - 1)) * 100;
                const y = 100 - ((p.wartosc - minVal) / range) * 100;
                return (
                  <div key={i} className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group" style={{ left: `${x}%`, top: `${y}%` }}>
                    <div className="w-3 h-3 bg-emerald-400 border-2 border-zinc-950 rounded-full shadow"></div>
                    <span className="absolute -top-7 text-[10px] bg-zinc-900 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-zinc-700 shadow">
                      {p.wartosc}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Oś X z datami */}
            <div className="flex justify-between text-[10px] text-zinc-500 mt-auto pt-32">
              <span>{przefiltrowane[0]?.data}</span>
              <span>{przefiltrowane[przefiltrowane.length - 1]?.data}</span>
            </div>
          </div>
        )}
      </div>

      {/* FORMULARZ DODAWANIA NOWEGO POMIARU */}
      <form onSubmit={dodajPomiar} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Dodaj nowy pomiar ({kategoria})</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">Wartość</label>
            <input 
              type="number" step="0.1" value={wartosc} onChange={(e) => setWartosc(e.target.value)}
              placeholder="np. 82.5" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">Data pomiaru</label>
            <input 
              type="date" value={dataPomiaru} onChange={(e) => setDataPomiaru(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow">
          Zapisz pomiar w historii
        </button>
      </form>

      {/* LISTA HISTORII DLA DANEJ KATEGORII */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Historia wpisów: {kategoria}</h2>
        <div className="space-y-2">
          {przefiltrowane.length === 0 ? (
            <p className="text-zinc-500 text-xs text-center py-3">Brak pomiarów dla tej kategorii.</p>
          ) : (
            przefiltrowane.slice().reverse().map((p) => (
              <div key={p.id} className="bg-zinc-800/40 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-emerald-400 text-sm">{p.wartosc}</span>
                  <span className="text-zinc-400 ml-2">({p.data})</span>
                </div>
                <button onClick={() => usunPomiar(p.id)} className="text-zinc-500 hover:text-red-400 font-bold px-2">Usuń</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}