// src/app/skaner/page.tsx
"use client";

import React, { useState } from 'react';
import BarcodeScanner from '@/app/components/BarcodeScanner';
import { pobierzProduktPoKodzie } from '@/app/lib/scanner';

export default function SkanerPage() {
  const [tryb, setTryb] = useState<'kamera' | 'tekst'>('tekst'); // Domyślnie ustawiamy na wygodny tekst/wyszukiwarkę!
  const [szukanaNazwa, setSzukanaNazwa] = useState('');
  const [produkt, setProdukt] = useState<any>(null);
  const [waga, setWaga] = useState<string>("100");
  const [laduje, setLaduje] = useState(false);
  const [komunikat, setKomunikat] = useState<string | null>(null);

  // Obsługa skanera kodów (opcjonalna)
  const handleScanSuccess = async (barcode: string) => {
    setLaduje(true);
    setKomunikat(`Zeskanowano kod: ${barcode}. Sprawdzam...`);
    try {
      const dane = await pobierzProduktPoKodzie(barcode);
      setProdukt(dane);
      setKomunikat(null);
    } catch (err) {
      try {
        const resAi = await fetch('/api/produkt-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ barcode })
        });
        const daneAi = await resAi.json();
        if (!resAi.ok) throw new Error();
        setProdukt(daneAi);
        setKomunikat(null);
      } catch {
        setKomunikat("Nie znaleziono produktu. Spróbuj wyszukać go po nazwie.");
      }
    } finally {
      setLaduje(false);
    }
  };

  // Obsługa szybkiego wyszukiwania po nazwie przez AI
  const handleSzukajPoNazwie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!szukanaNazwa.trim()) return;

    setLaduje(true);
    setKomunikat(null);
    try {
      const res = await fetch('/api/szukaj-produktu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nazwaProduktu: szukanaNazwa })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProdukt(data);
      setSzukanaNazwa('');
    } catch (err: any) {
      setKomunikat("Nie udało się znaleźć takiego produktu.");
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

  return (
    <div className="max-w-xl mx-auto p-6 text-white min-h-screen bg-zinc-950">
      <h1 className="text-2xl font-bold mb-6 text-emerald-400 text-center">Dodawanie Posiłku do Diety</h1>
      
      {/* Przełącznik trybów */}
      {!produkt && (
        <div className="flex bg-zinc-900 p-1 rounded-xl mb-6 border border-zinc-800">
          <button 
            onClick={() => setTryb('tekst')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${tryb === 'tekst' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            🔍 Szybkie wpisanie / Szukaj
          </button>
          <button 
            onClick={() => setTryb('kamera')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition text-sm ${tryb === 'kamera' ? 'bg-emerald-600 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
          >
            📷 Skaner kodów
          </button>
        </div>
      )}

      {!produkt ? (
        <div className="space-y-4">
          {tryb === 'tekst' ? (
            <form onSubmit={handleSzukajPoNazwie} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Wpisz nazwę produktu (np. jogurt naturalny primo, serek wiejski, ryż):</label>
                <input 
                  type="text" 
                  value={szukanaNazwa}
                  onChange={(e) => setSzukanaNazwa(e.target.value)}
                  placeholder="np. banan, owsianka, pierś z kurczaka..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button 
                type="submit" 
                disabled={laduje}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {laduje ? "Szukam w bazie AI..." : "Znajdź produkt i makro"}
              </button>
            </form>
          ) : (
            <BarcodeScanner onScanSuccess={handleScanSuccess} />
          )}

          {laduje && tryb === 'kamera' && <p className="text-center text-yellow-400 animate-pulse font-medium">Skanuję kod...</p>}
          {komunikat && <p className="text-center text-amber-400 text-sm bg-amber-950/40 p-3 rounded-lg border border-amber-900/50">{komunikat}</p>}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4 shadow-xl">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{produkt.nazwa}</h2>
            <p className="text-sm text-zinc-400">{produkt.marka || "Produkt z bazy AI"}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Waga zjedzonej porcji (gramy / ml):</label>
            <input 
              type="number" 
              value={waga} 
              onChange={(e) => setWaga(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white text-lg font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-zinc-800/60 p-4 rounded-lg grid grid-cols-2 gap-4 text-center border border-zinc-700/50">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Kalorie</p>
              <p className="text-2xl font-black text-emerald-400">{kalorie} <span className="text-sm font-normal text-zinc-400">kcal</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Białko</p>
              <p className="text-xl font-bold text-white">{bialko} <span className="text-sm font-normal text-zinc-400">g</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Węglowodany</p>
              <p className="text-xl font-bold text-white">{weglowodany} <span className="text-sm font-normal text-zinc-400">g</span></p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Tłuszcze</p>
              <p className="text-xl font-bold text-white">{tluszcze} <span className="text-sm font-normal text-zinc-400">g</span></p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => {
                alert(`Dodano do dziennika: ${kalorie} kcal (${bialko}g B, ${weglowodany}g W,${tluszcze}g T)`);
                setProdukt(null);
                setWaga("100");
                setKomunikat(null);
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-emerald-900/30"
            >
              Zatwierdź i dodaj
            </button>
            <button 
              onClick={() => { setProdukt(null); setKomunikat(null); setWaga("100"); }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-lg transition font-medium"
            >
              Szukaj innego
            </button>
          </div>
        </div>
      )}
    </div>
  );
}