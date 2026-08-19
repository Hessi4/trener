// src/app/skaner/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BarcodeScanner from '@/app/components/BarcodeScanner';
import { pobierzProduktPoKodzie } from '@/app/lib/scanner';

export default function SkanerPage() {
  const router = useRouter();
  const [tryb, setTryb] = useState<'kamera' | 'tekst'>('tekst'); 
  const [szukanaNazwa, setSzukanaNazwa] = useState('');
  
  const [listaWyszukiwania, setListaWyszukiwania] = useState<any[] | null>(null); 
  const [produkt, setProdukt] = useState<any>(null);
  
  const [waga, setWaga] = useState<string>("100");
  const [laduje, setLaduje] = useState(false);
  const [komunikat, setKomunikat] = useState<string | null>(null);

  const handleScanSuccess = async (barcode: string) => {
    setLaduje(true);
    setKomunikat(`Zeskanowano kod: ${barcode}. Sprawdzam...`);
    try {
      const dane = await pobierzProduktPoKodzie(barcode);
      setProdukt(dane);
      setKomunikat(null);
    } catch (err) {
      try {
        const resAi = await fetch('/api/asystent/produkt-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode })
        });
        const daneAi = await resAi.json();
        if (!resAi.ok) throw new Error(daneAi.error || "Błąd AI");
        setProdukt(daneAi); 
        setKomunikat(null);
      } catch (errAi: any) {
        setKomunikat(`Błąd: ${errAi.message}`);
      }
    } finally {
      setLaduje(false);
    }
  };

  const handleSzukajPoNazwie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!szukanaNazwa.trim()) return;

    setLaduje(true);
    setKomunikat(null);
    setListaWyszukiwania(null);
    try {
      const res = await fetch('/api/asystent/szukaj-produktu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nazwaProduktu: szukanaNazwa })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Nieznany błąd serwera");
      }

      if (data.warianty && Array.isArray(data.warianty)) {
        setListaWyszukiwania(data.warianty);
      } else if (Array.isArray(data) && data.length > 0) {
        setListaWyszukiwania(data);
      } else if (data.nazwa) {
        setListaWyszukiwania([data]); 
      } else {
        throw new Error("Brak wyników w odpowiedzi AI.");
      }
      
      setSzukanaNazwa('');
    } catch (err: any) {
      // TERAZ APLIKACJA POKAŻE PRAWDZIWY BŁĄD!
      setKomunikat(`Błąd: ${err.message}`);
    } finally {
      setLaduje(false);
    }
  };

  const wagaNum = parseFloat(waga) || 0;
  const mnoznik = wagaNum / 100;

  const kalorie = Math.round(produkt ? produkt.kalorieNa100g * mnoznik : 0);
  const bialko = Math.round((produkt ? produkt.bialkoNa100g * mnoznik : 0) * 10) / 10;
  const weglowodany = Math.round((produkt ? produkt.weglowodanyNa100g * mnoznik : 0) * 10) / 10;
  const tluszcze = Math.round((produkt ? produkt.tluszczeNa100g * mnoznik : 0) * 10) / 10;

  const dodajPosilekDoBazy = () => {
    if (!produkt) return;

    const zapisanePosilki = localStorage.getItem('moje_posilki_dzis');
    const aktualnePosilki = zapisanePosilki ? JSON.parse(zapisanePosilki) : [];

    const dzisiejszaData = new Date().toISOString().split('T')[0];
    const nowyPosilek = {
      id: Date.now(),
      nazwa: `${produkt.nazwa} (${wagaNum}g)`,
      kalorie: kalorie,
      bialko: bialko,
      weglowodany: weglowodany,
      tluszcze: tluszcze,
      data: dzisiejszaData,
    };

    const zaktualizowane = [...aktualnePosilki, nowyPosilek];
    localStorage.setItem('moje_posilki_dzis', JSON.stringify(zaktualizowane));

    router.push('/');
  };

  return (
    <div className="max-w-xl mx-auto p-6 text-white min-h-screen bg-zinc-950">
      
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold transition">
          ← Wróć
        </Link>
        <h1 className="text-xl font-bold text-emerald-400">Znajdź Posiłek</h1>
      </div>
      
      {!produkt && !listaWyszukiwania && (
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
          <button 
            onClick={() => setTryb('tekst')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${tryb === 'tekst' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            🔍 Wyszukaj
          </button>
          <button 
            onClick={() => setTryb('kamera')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${tryb === 'kamera' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            📷 Skaner
          </button>
        </div>
      )}

      {!produkt && !listaWyszukiwania && (
        <div className="space-y-4">
          {tryb === 'tekst' ? (
            <form onSubmit={handleSzukajPoNazwie} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Wpisz nazwę produktu (np. Tymbark, mleko, serek wiejski):</label>
                <input 
                  type="text" 
                  value={szukanaNazwa}
                  onChange={(e) => setSzukanaNazwa(e.target.value)}
                  placeholder="np. Tymbark..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={laduje}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {laduje ? "Szukam wariantów..." : <><span>Znajdź warianty AI</span> ✨</>}
              </button>
            </form>
          ) : (
            <BarcodeScanner onScanSuccess={handleScanSuccess} />
          )}

          {laduje && tryb === 'kamera' && <p className="text-center text-yellow-400 animate-pulse font-medium">Skanuję kod...</p>}
          {/* TEN KOMUNIKAT POKAŻE NAM DOKŁADNY POWÓD AWARII */}
          {komunikat && <p className="text-center text-amber-400 text-sm bg-amber-950/40 p-3 rounded-lg border border-amber-900/50">{komunikat}</p>}
        </div>
      )}

      {!produkt && listaWyszukiwania && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold text-white">Wybierz wariant:</h2>
            <button onClick={() => setListaWyszukiwania(null)} className="text-xs text-zinc-400 hover:text-white underline">
              Anuluj
            </button>
          </div>
          
          <div className="space-y-3">
            {listaWyszukiwania.map((p: any, i: number) => (
              <button 
                key={i} 
                onClick={() => { setProdukt(p); setListaWyszukiwania(null); }}
                className="w-full text-left bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700 p-4 rounded-xl transition"
              >
                <p className="font-bold text-emerald-400">{p.nazwa}</p>
                <p className="text-[10px] text-zinc-400 mb-2">{p.marka}</p>
                
                <div className="flex gap-3 text-xs text-zinc-300 font-medium">
                  <span className="bg-zinc-900 px-2 py-1 rounded">🔥 {p.kalorieNa100g} kcal</span>
                  <span className="bg-zinc-900 px-2 py-1 rounded text-indigo-400">B: {p.bialkoNa100g}g</span>
                  <span className="bg-zinc-900 px-2 py-1 rounded text-rose-400">T: {p.tluszczeNa100g}g</span>
                  <span className="bg-zinc-900 px-2 py-1 rounded text-amber-400">W: {p.weglowodanyNa100g}g</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {produkt && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{produkt.nazwa}</h2>
            <p className="text-sm text-zinc-400">{produkt.marka || "Rozpoznano z bazy"}</p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-sm font-medium text-zinc-300">Waga zjedzonej porcji (gramy / ml):</label>
            <input 
              type="number" 
              value={waga} 
              onChange={(e) => setWaga(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-lg font-semibold text-center focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-zinc-800/60 p-4 rounded-lg grid grid-cols-2 gap-4 text-center border border-zinc-700/50 mt-4">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Kalorie</p>
              <p className="text-2xl font-black text-emerald-400">{kalorie} <span className="text-sm font-normal text-zinc-400">kcal</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Białko</p>
              <p className="text-xl font-bold text-indigo-400">{bialko} <span className="text-sm font-normal text-zinc-500">g</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Tłuszcze</p>
              <p className="text-xl font-bold text-rose-400">{tluszcze} <span className="text-sm font-normal text-zinc-500">g</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Węglowodany</p>
              <p className="text-xl font-bold text-amber-400">{weglowodany} <span className="text-sm font-normal text-zinc-500">g</span></p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={dodajPosilekDoBazy}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/30"
            >
              Dodaj do diety
            </button>
            <button 
              onClick={() => { setProdukt(null); setKomunikat(null); setWaga("100"); }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-lg transition font-medium"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}