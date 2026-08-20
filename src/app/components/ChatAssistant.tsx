// src/app/components/ChatAssistant.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';

interface ChatAssistantProps {
  onPlanUpdated?: (nowyPlan: any) => void;
  onPosilekAdded?: (nowyPosilek: any) => void;
}

export default function ChatAssistant({ onPlanUpdated, onPosilekAdded }: ChatAssistantProps) {
  const [otwarty, setOtwarty] = useState(false);
  const [wiadomosci, setWiadomosci] = useState<Array<{ rola: 'user' | 'ai'; tekst: string }>>([
    { rola: 'ai', tekst: 'Cześć! Jestem Twoim trenerem. Możesz zapytać o technikę, poprosić o zamianę ćwiczenia w locie (np. gdy coś boli) lub napisać co zjadłeś, a dodam to do kalorii!' }
  ]);
  const [inputTekst, setInputTekst] = useState('');
  const [laduje, setLaduje] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [wiadomosci, otwarty]);

  const wyslijWiadomosc = async (tekstDoWyslania?: string) => {
    const tresc = (tekstDoWyslania || inputTekst).trim();
    if (!tresc || laduje) return;

    const nowaHistoria = [...wiadomosci, { rola: 'user' as const, tekst: tresc }];
    setWiadomosci(nowaHistoria);
    setInputTekst('');
    setLaduje(true);

    try {
      const zapisanyPlan = localStorage.getItem('wygenerowany_plan_ai');
      const aktualnyPlan = zapisanyPlan ? JSON.parse(zapisanyPlan) : null;
      const dzis = new Date().toISOString().split('T')[0];

      const res = await fetch('/api/asystent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wiadomosc: tresc,
          aktualnyPlan,
          historiaRozmowy: nowaHistoria.slice(-6),
          dzisiejszaData: dzis
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd odpowiedzi asystenta.");

      setWiadomosci(prev => [...prev, { rola: 'ai', tekst: data.odpowiedz }]);

      // Akcja: zmiana planu treningowego w locie
      if (data.typAkcji === 'ZMIEN_PLAN' && data.zaktualizowanyPlan) {
        localStorage.setItem('wygenerowany_plan_ai', JSON.stringify(data.zaktualizowanyPlan));
        if (onPlanUpdated) onPlanUpdated(data.zaktualizowanyPlan);
      }

      // Akcja: dodanie posiłku
      if (data.typAkcji === 'DODAJ_POSILEK' && data.nowyPosilek) {
        const zapisanePosilki = localStorage.getItem('moje_posilki_dzis');
        const aktualne = zapisanePosilki ? JSON.parse(zapisanePosilki) : [];
        const meal = {
          id: Date.now(),
          nazwa: data.nowyPosilek.nazwa,
          kalorie: Number(data.nowyPosilek.kalorie) || 0,
          bialko: Number(data.nowyPosilek.bialko) || 0,
          weglowodany: Number(data.nowyPosilek.weglowodany) || 0,
          tluszcze: Number(data.nowyPosilek.tluszcze) || 0,
          data: dzis
        };
        const zaktualizowane = [...aktualne, meal];
        localStorage.setItem('moje_posilki_dzis', JSON.stringify(zaktualizowane));
        if (onPosilekAdded) onPosilekAdded(meal);
      }

    } catch (err: any) {
      setWiadomosci(prev => [...prev, { rola: 'ai', tekst: `⚠️ ${err.message || 'Wystąpił błąd połączenia.'}` }]);
    } finally {
      setLaduje(false);
    }
  };

  return (
    <>
      {/* PŁYWAJĄCY PRZYCISK W PRAWYM DOLNYM ROGU */}
      <button
        onClick={() => setOtwarty(!otwarty)}
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold p-4 rounded-full shadow-2xl transition transform hover:scale-105 flex items-center justify-center border-2 border-emerald-300"
        aria-label="Otwórz czat asystenta"
      >
        {otwarty ? (
          <span className="text-xl leading-none">✕</span>
        ) : (
          <span className="text-xl leading-none">💬</span>
        )}
      </button>

      {/* OKNO CZATU */}
      {otwarty && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[92vw] sm:w-96 max-h-[75vh] h-[520px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          {/* NAGŁÓWEK CZATU */}
          <div className="bg-zinc-950 p-3.5 border-b border-zinc-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="text-xs font-bold text-white">Trener AI</h3>
                <p className="text-[10px] text-zinc-400">Na bieżąco dostosowuje Twój plan i dietę</p>
              </div>
            </div>
            <button onClick={() => setOtwarty(false)} className="text-zinc-400 hover:text-white text-sm px-2">✕</button>
          </div>

          {/* LISTA WIADOMOŚCI */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {wiadomosci.map((w, idx) => (
              <div key={idx} className={`flex ${w.rola === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-2.5 text-xs leading-relaxed ${
                  w.rola === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-none' 
                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700/60 rounded-bl-none'
                }`}>
                  {w.tekst}
                </div>
              </div>
            ))}
            {laduje && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 text-xs p-2.5 rounded-xl border border-zinc-700/60 animate-pulse">
                  Trener myśli... ⏳
                </div>
              </div>
            )}
          </div>

          {/* SZYBKIE PODPOWIEDZI (CHIPSY) */}
          <div className="p-2 bg-zinc-950 border-t border-zinc-800/80 flex gap-1.5 overflow-x-auto text-[11px]">
            <button 
              type="button"
              onClick={() => wyslijWiadomosc("Podsumuj mój dzisiejszy bilans kalorii, makroskładniki i postępy treningowe")} 
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg whitespace-nowrap transition border border-zinc-700"
            >
              📊 Podsumowanie dnia
            </button>
            <button 
              type="button"
              onClick={() => wyslijWiadomosc("Daj mi 2-3 konkretne wskazówki dotyczące dzisiejszego treningu i diety")} 
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg whitespace-nowrap transition border border-zinc-700"
            >
              💡 Wskazówki trenera
            </button>
          </div>

          {/* POLE WPISYWANIA */}
          <form 
            onSubmit={(e) => { e.preventDefault(); wyslijWiadomosc(); }}
            className="p-2.5 bg-zinc-950 flex gap-2 border-t border-zinc-800"
          >
            <input 
              type="text" 
              value={inputTekst} 
              onChange={(e) => setInputTekst(e.target.value)}
              placeholder="Napisz do trenera..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button 
              type="submit" 
              disabled={laduje || !inputTekst.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl text-xs transition"
            >
              Wyślij
            </button>
          </form>
        </div>
      )}
    </>
  );
}