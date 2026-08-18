// src/app/pulpit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { PlanTygodniowyAI, ProfilUzytkownikaRozszerzony } from '@/app/typy/uzytkownik';
import { Flame, Dumbbell, Waves, Footprints, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const DNI_TYGODNIA = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

export default function Pulpit() {
  const [profil, setProfil] = useState<ProfilUzytkownikaRozszerzony | null>(null);
  const [planAI, setPlanAI] = useState<PlanTygodniowyAI | null>(null);
  const [aktywnyDzien, setAktywnyDzien] = useState<string>('Poniedziałek');

  useEffect(() => {
    const zapisanyProfil = localStorage.getItem('profil_uzytkownika');
    const zapisanyPlan = localStorage.getItem('wygenerowany_plan_ai');

    if (zapisanyProfil) setProfil(JSON.parse(zapisanyProfil));
    if (zapisanyPlan) setPlanAI(JSON.parse(zapisanyPlan));

    const dzisiejszyDzien = DNI_TYGODNIA[new Date().getDay()];
    setAktywnyDzien(dzisiejszyDzien);
  }, []);

  if (!profil || !planAI) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-xl font-bold mb-2">Brak wygenerowanego planu</h1>
        <p className="text-xs text-slate-400 mb-6 max-w-xs">Wypełnij ankietę startową, aby asystent AI przygotował dla Ciebie plan.</p>
        <Link
          href="/ankieta-startowa"
          className="bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-emerald-500/20"
        >
          Przejdź do konfiguratora
        </Link>
      </main>
    );
  }

  const dzisiejszyTrening = planAI.treningiTygodnia.find((t) => t.dzienTygodnia === aktywnyDzien) || planAI.treningiTygodnia[0];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-28 max-w-lg mx-auto space-y-4">
      {/* Nagłówek */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Trener Personalny AI</span>
          <h1 className="text-xl font-black text-white">Twój Panel</h1>
        </div>
        <Link 
          href="/ankieta-startowa"
          className="text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-slate-400 hover:text-white flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Nowy plan</span>
        </Link>
      </div>

      {/* Makroskładniki wygenerowane przez AI */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <Flame className="w-4 h-4" />
            <span>Dobowe Makro (Deficyt)</span>
          </div>
          <span className="text-lg font-black text-white">{planAI.makroskladniki.kalorieKcal} <span className="text-xs font-normal text-slate-400">kcal</span></span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-800/50 border border-slate-700/40 p-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-medium">Białko</span>
            <span className="text-xs font-bold text-emerald-400">{planAI.makroskladniki.bialkoGramy}g</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 p-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-medium">Węgle</span>
            <span className="text-xs font-bold text-amber-400">{planAI.makroskladniki.weglowodanyGramy}g</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/40 p-2 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-medium">Tłuszcze</span>
            <span className="text-xs font-bold text-rose-400">{planAI.makroskladniki.tluszczeGramy}g</span>
          </div>
        </div>
      </div>

      {/* Przełącznik dni tygodnia */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {planAI.treningiTygodnia.map((t) => (
          <button
            key={t.dzienTygodnia}
            onClick={() => setAktywnyDzien(t.dzienTygodnia)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              aktywnyDzien === t.dzienTygodnia
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-400'
            }`}
          >
            {t.dzienTygodnia.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Karta Treningu na wybrany dzień */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${
            dzisiejszyTrening.typ === 'Basen' ? 'bg-cyan-500/20 text-cyan-400' :
            dzisiejszyTrening.typ === 'Siłownia' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
          }`}>
            {dzisiejszyTrening.typ === 'Basen' && <Waves className="w-6 h-6" />}
            {dzisiejszyTrening.typ === 'Siłownia' && <Dumbbell className="w-6 h-6" />}
            {dzisiejszyTrening.typ === 'Regeneracja' && <Footprints className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{dzisiejszyTrening.tytul}</h2>
            <span className="text-[11px] text-slate-400">{dzisiejszyTrening.akcent}</span>
          </div>
        </div>

        {/* Lista ćwiczeń / zadań pływackich */}
        <div className="space-y-2.5">
          {dzisiejszyTrening.cwiczeniaIZadania.map((zadanie, idx) => (
            <div key={idx} className="p-3 bg-slate-800/40 rounded-2xl border border-slate-700/40 space-y-1">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-xs text-white">{zadanie.nazwa}</span>
              </div>
              <p className="text-[11px] font-medium text-emerald-400">{zadanie.opisSerii}</p>
              {zadanie.uwagiTechniczne && (
                <p className="text-[10px] text-slate-400 italic">{zadanie.uwagiTechniczne}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dolny pasek akcji */}
      <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto flex items-center gap-3">
        <button 
          onClick={() => alert('W kolejnym kroku podepniemy skaner kodów kreskowych i bazę produktów!')}
          className="flex-1 bg-slate-900 border border-slate-800 text-white font-semibold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl text-xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Dodaj posiłek</span>
        </button>

        <button 
          onClick={() => alert('W kolejnym kroku podepniemy czat głosowy z AI!')}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-3 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}