// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PulpitGłówny() {
  const [plan, setPlan] = useState<any>(null);
  
  // Stan treningów siłowych
  const [wybranyDzienIdx, setWybranyDzienIdx] = useState<number>(0);
  const [wybraneCwiczenie, setWybraneCwiczenie] = useState('');
  
  // Dynamiczne serie w formacie z aplikacji treningowych
  const [serie, setSerie] = useState<Array<{ set: number, ciezar: string, powtorzenia: string, ukoczona: boolean }>>([
    { set: 1, ciezar: '', powtorzenia: '', ukoczona: false }
  ]);

  const [treningiZapis, setTreningiZapis] = useState<any[]>([]);

  // Posiłki i kalorie
  const [posilki, setPosilki] = useState<any[]>([]);
  const [nazwaPosilku, setNazwaPosilku] = useState('');
  const [kalorie, setKalorie] = useState('');
  const [bialko, setBialko] = useState('');

  useEffect(() => {
    const zapisanyPlan = localStorage.getItem('wygenerowany_plan_ai');
    if (zapisanyPlan) setPlan(JSON.parse(zapisanyPlan));

    const zapisaneTreningi = localStorage.getItem('moje_treningi_dzis');
    if (zapisaneTreningi) setTreningiZapis(JSON.parse(zapisaneTreningi));

    const zapisanePosilki = localStorage.getItem('moje_posilki_dzis');
    if (zapisanePosilki) setPosilki(JSON.parse(zapisanePosilki));
  }, []);

  // Pobranie wyniku z poprzedniego treningu dla konkretnego numeru serii (PREV)
  const pobierzPoprzedniWynikDlaSerii = (nazwaCwiczenia: string, nrSerii: number) => {
    const historiaDlaCwiczenia = treningiZapis.filter(t => t.cwiczenie === nazwaCwiczenia);
    if (historiaDlaCwiczenia.length === 0) return "-";
    
    const ostatniTrening = historiaDlaCwiczenia[historiaDlaCwiczenia.length - 1];
    if (!ostatniTrening.serie || !ostatniTrening.serie[nrSerii - 1]) return "-";

    const prevS = ostatniTrening.serie[nrSerii - 1];
    return `${prevS.ciezar || 0} x ${prevS.powtorzenia || 0}`;
  };

  const dodajSerie = () => {
    setSerie([...serie, { set: serie.length + 1, ciezar: '', powtorzenia: '', ukoczona: false }]);
  };

  const zmianaSerii = (index: number, pole: 'ciezar' | 'powtorzenia', wartosc: string) => {
    const zaktualizowane = [...serie];
    zaktualizowane[index][pole] = wartosc;
    setSerie(zaktualizowane);
  };

  const toggleUkoczona = (index: number) => {
    const zaktualizowane = [...serie];
    zaktualizowane[index].ukoczona = !zaktualizowane[index].ukoczona;
    setSerie(zaktualizowane);
  };

  const zapiszWynikTreningu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wybraneCwiczenie) return;

    const ukoczoneSerie = serie.filter(s => s.ukoczona && s.ciezar && s.powtorzenia);
    if (ukoczoneSerie.length === 0) {
      alert("Zaznacz przynajmniej jedną ukończoną serię (zielony przycisk z fajką), aby zapisać wynik!");
      return;
    }

    const nowyWynik = {
      id: Date.now(),
      cwiczenie: wybraneCwiczenie,
      serie: ukoczoneSerie,
      data: new Date().toLocaleDateString(),
      podsumowanie: ukoczoneSerie.map(s => `S${s.set}: ${s.ciezar}kg×${s.powtorzenia}`).join(' | ')
    };

    const zaktualizowane = [...treningiZapis, nowyWynik];
    setTreningiZapis(zaktualizowane);
    localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));

    setSerie([{ set: 1, ciezar: '', powtorzenia: '', ukoczona: false }]);
  };

  const usunWynik = (id: number) => {
    const zaktualizowane = treningiZapis.filter(t => t.id !== id);
    setTreningiZapis(zaktualizowane);
    localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));
  };

  const dodajPosilek = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nazwaPosilku || !kalorie) return;

    const nowy = {
      id: Date.now(),
      nazwa: nazwaPosilku,
      kalorie: Number(kalorie) || 0,
      bialko: Number(bialko) || 0,
    };

    const zaktualizowane = [...posilki, nowy];
    setPosilki(zaktualizowane);
    localStorage.setItem('moje_posilki_dzis', JSON.stringify(zaktualizowane));

    setNazwaPosilku('');
    setKalorie('');
    setBialko('');
  };

  const usunPosilek = (id: number) => {
    const zaktualizowane = posilki.filter(p => p.id !== id);
    setPosilki(zaktualizowane);
    localStorage.setItem('moje_posilki_dzis', JSON.stringify(zaktualizowane));
  };

  const dniTreningowe = plan?.treningiTygodnia || [];
  const aktualnyDzienObj = dniTreningowe[wybranyDzienIdx];

  const sumaKcal = posilki.reduce((acc, curr) => acc + curr.kalorie, 0);
  const sumaBialko = posilki.reduce((acc, curr) => acc + curr.bialko, 0);
  const celKcal = plan?.makroskladniki?.kalorieKcal || 2250;
  const celBialko = plan?.makroskladniki?.bialkoGramy || 170;
  const zostaloKcal = celKcal - sumaKcal;

  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen bg-zinc-950 space-y-6 pb-16">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Twój Pulpit Treningowy</h1>
          <p className="text-xs text-zinc-400">Wszystko w jednym miejscu</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href="/pomiary" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow">
            📈 Pomiary ciała
          </Link>
          <Link href="/edytor-planu" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow">
            ✏️ Edytor Planu
          </Link>
          <Link href="/skaner" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl transition">
            📷 Skaner
          </Link>
        </div>
      </div>

      {/* LICZNIK KALORII */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Zjedzone dziś</p>
            <p className="text-3xl font-black text-white">{sumaKcal} <span className="text-sm font-normal text-zinc-400">/ {celKcal} kcal</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Pozostało</p>
            <p className={`text-2xl font-black ${zostaloKcal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {zostaloKcal} kcal
            </p>
          </div>
        </div>
        <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(100, (sumaKcal / celKcal) * 100)}%` }}></div>
        </div>
        <p className="text-xs text-zinc-400 text-center">Białko: <b>{sumaBialko}g</b> / {celBialko}g</p>
      </div>

      {/* SEKCJA TRENINGU Z PLANU AI */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-emerald-400">💪 Trening z Twojego Planu</h2>
        
        {dniTreningowe.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-zinc-400 text-sm">Brak wygenerowanego planu treningowego.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Wybór dnia */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dniTreningowe.map((dzien: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => { setWybranyDzienIdx(idx); setWybraneCwiczenie(''); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${wybranyDzienIdx === idx ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                >
                  {dzien.dzienTygodnia} ({dzien.typ})
                </button>
              ))}
            </div>

            {/* Ćwiczenia z danego dnia */}
            {aktualnyDzienObj && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div>
                  <h3 className="font-bold text-white text-sm">{aktualnyDzienObj.tytul} <span className="text-xs text-emerald-400 font-normal">({aktualnyDzienObj.akcent})</span></h3>
                  <p className="text-xs text-zinc-400">Wybierz ćwiczenie, aby zarejestrować serie:</p>
                </div>

                <div className="space-y-2">
                  {aktualnyDzienObj.cwiczeniaIZadania?.map((cw: any, cIdx: number) => {
                    const isSelected = wybraneCwiczenie === cw.nazwa;
                    const ostatniTrening = treningiZapis.slice().reverse().find(t => t.cwiczenie === cw.nazwa);
                    const ostatniStatus = ostatniTrening ? `Ostatnio: ${ostatniTrening.podsumowanie}` : "Brak historii – zacznij dzisiaj!";

                    return (
                      <div 
                        key={cIdx}
                        onClick={() => {
                          setWybraneCwiczenie(cw.nazwa);
                          setSerie([{ set: 1, ciezar: '', powtorzenia: '', ukoczona: false }]);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${isSelected ? 'bg-emerald-950/40 border-emerald-500 shadow' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-xs">{cw.nazwa}</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">Plan: {cw.opisSerii}</span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium">{ostatniStatus}</p>
                      </div>
                    );
                  })}
                </div>

                {/* FORMULARZ SERII W STYLU APLIKACJI TRENINGOWYCH */}
                {wybraneCwiczenie && (
                  <div className="bg-zinc-900 p-4 rounded-xl border border-emerald-500/50 space-y-3 mt-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-white">Rejestrujesz: <span className="text-emerald-400">{wybraneCwiczenie}</span></p>
                      <button onClick={() => setWybraneCwiczenie('')} className="text-xs text-zinc-500 hover:text-white">Zamknij</button>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-400 uppercase font-bold text-center pt-2">
                      <span className="col-span-1">SET</span>
                      <span className="col-span-4">PREV</span>
                      <span className="col-span-3">KG</span>
                      <span className="col-span-3">REPS</span>
                      <span className="col-span-1">✅</span>
                    </div>

                    {serie.map((s, idx) => {
                      const prevWynik = pobierzPoprzedniWynikDlaSerii(wybraneCwiczenie, s.set);

                      return (
                        <div key={idx} className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-lg transition ${s.ukoczona ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-zinc-800/40'}`}>
                          <span className="col-span-1 text-xs font-bold text-emerald-400 text-center">{s.set}</span>
                          <span className="col-span-4 text-[11px] text-zinc-400 text-center truncate">{prevWynik}</span>
                          <div className="col-span-3">
                            <input 
                              type="number" step="0.5" value={s.ciezar} 
                              onChange={(e) => zmianaSerii(idx, 'ciezar', e.target.value)}
                              placeholder="kg" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                            />
                          </div>
                          <div className="col-span-3">
                            <input 
                              type="number" value={s.powtorzenia} 
                              onChange={(e) => zmianaSerii(idx, 'powtorzenia', e.target.value)}
                              placeholder="reps" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <button 
                              type="button" 
                              onClick={() => toggleUkoczona(idx)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition ${s.ukoczona ? 'bg-emerald-600 text-white shadow' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button 
                      type="button" 
                      onClick={dodajSerie}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 rounded-lg text-xs transition border border-zinc-700"
                    >
                      + ADD SET
                    </button>

                    <button 
                      type="button"
                      onClick={zapiszWynikTreningu}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition shadow"
                    >
                      Zapisz ukończone serie w dzienniku
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {treningiZapis.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase">Dzisiejsze serie:</h3>
            {treningiZapis.map((t) => (
              <div key={t.id} className="bg-zinc-800/40 border border-zinc-800 p-3 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-white">{t.cwiczenie}</p>
                  <p className="text-[11px] text-emerald-400 font-medium">{t.podsumowanie}</p>
                </div>
                <button onClick={() => usunWynik(t.id)} className="text-zinc-500 hover:text-red-400 font-bold px-2">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEKCJA POSIŁKÓW */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white">🥗 Dodaj Posiłek</h2>
        <form onSubmit={dodajPosilek} className="space-y-3">
          <input 
            type="text" value={nazwaPosilku} onChange={(e) => setNazwaPosilku(e.target.value)}
            placeholder="Nazwa posiłku (np. Serek wiejski)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="number" value={kalorie} onChange={(e) => setKalorie(e.target.value)}
              placeholder="Kalorie (kcal)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
            />
            <input 
              type="number" value={bialko} onChange={(e) => setBialko(e.target.value)}
              placeholder="Białko (g)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white"
            />
          </div>
          <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2.5 rounded-xl text-xs transition">
            Zapisz posiłek
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {posilki.map((p) => (
            <div key={p.id} className="bg-zinc-800/40 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center text-xs">
              <span>{p.nazwa} ({p.kalorie} kcal)</span>
              <button onClick={() => usunPosilek(p.id)} className="text-zinc-500 hover:text-red-400">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}