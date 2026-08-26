// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function PulpitGłówny() {
  const router = useRouter();
  const [plan, setPlan] = useState<any>(null);
  const [ladowanie, setLadowanie] = useState(true);
  
  // --- SYSTEM DAT ---
  const getDzis = () => new Date().toISOString().split('T')[0];
  const [wybranaData, setWybranaData] = useState<string>(getDzis());

  // Stan treningów
  const [wybranyDzienIdx, setWybranyDzienIdx] = useState<number>(0);
  const [wybraneCwiczenie, setWybraneCwiczenie] = useState('');
  const [typCwiczenia, setTypCwiczenia] = useState<'silowe' | 'plywanie' | 'cardio' | 'status'>('silowe');
  const [serie, setSerie] = useState<Array<{ 
    set: number; 
    ciezar: string; 
    powtorzenia: string; 
    dystans: string; 
    czas: string; 
    ukoczona: boolean 
  }>>([
    { set: 1, ciezar: '', powtorzenia: '', dystans: '', czas: '', ukoczona: false }
  ]);
  const [treningiZapis, setTreningiZapis] = useState<any[]>([]);

  // Posiłki
  const [posilki, setPosilki] = useState<any[]>([]);
  const [nazwaPosilku, setNazwaPosilku] = useState('');
  const [wagaPosilku, setWagaPosilku] = useState('');
  const [kalorie, setKalorie] = useState('');
  const [bialko, setBialko] = useState('');
  const [weglowodany, setWeglowodany] = useState('');
  const [tluszcze, setTluszcze] = useState('');
  
  const [ladowanieAiPosilek, setLadowanieAiPosilek] = useState(false);

  // GŁÓWNA INICJALIZACJA Z SUPABASE
  useEffect(() => {
    async function wczytajDaneZChmury() {
      try {
        // 1. Pobieranie planu z Supabase
        const { data: planData } = await supabase
          .from('plany')
          .select('dane_planu')
          .eq('id', 'domyslny_uzytkownik')
          .single();

        let aktualnyPlan = planData?.dane_planu;

        // Fallback do localStorage jeśli w bazie jeszcze nie ma
        if (!aktualnyPlan) {
          const zapisanyLocal = localStorage.getItem('wygenerowany_plan_ai');
          if (zapisanyLocal) {
            aktualnyPlan = JSON.parse(zapisanyLocal);
            // Wyślij do Supabase w tle
            supabase.from('plany').upsert({ id: 'domyslny_uzytkownik', dane_planu: aktualnyPlan });
          }
        }

        if (!aktualnyPlan) {
          router.push('/ankieta-startowa');
          return;
        }

        setPlan(aktualnyPlan);

        // 2. Pobieranie treningów z Supabase
        const { data: treningiData } = await supabase
          .from('treningi')
          .select('*')
          .order('utworzono_at', { ascending: true });

        if (treningiData && treningiData.length > 0) {
          setTreningiZapis(treningiData);
        } else {
          const localT = localStorage.getItem('moje_treningi_dzis');
          if (localT) setTreningiZapis(JSON.parse(localT));
        }

        // 3. Pobieranie posiłków z Supabase
        const { data: posilkiData } = await supabase
          .from('posilki')
          .select('*')
          .order('utworzono_at', { ascending: true });

        if (posilkiData && posilkiData.length > 0) {
          setPosilki(posilkiData);
        } else {
          const localP = localStorage.getItem('moje_posilki_dzis');
          if (localP) setPosilki(JSON.parse(localP));
        }

      } catch (err) {
        console.error("Błąd pobierania danych z Supabase:", err);
      } finally {
        setLadowanie(false);
      }
    }

    wczytajDaneZChmury();
  }, [router]);

  useEffect(() => {
    if (plan?.treningiTygodnia) {
      const dni = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
      const dzisiejszaNazwa = dni[new Date(wybranaData).getDay()];
      
      const index = plan.treningiTygodnia.findIndex((d: any) => d.dzienTygodnia === dzisiejszaNazwa);
      if (index !== -1) {
        setWybranyDzienIdx(index);
        setWybraneCwiczenie(''); 
      }
    }
  }, [wybranaData, plan]);

  if (ladowanie) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-emerald-400">
        <p className="font-bold animate-pulse">Łączenie z bazą danych...</p>
      </div>
    );
  }

  const zmienDate = (dniOffset: number) => {
    const d = new Date(wybranaData);
    d.setDate(d.getDate() + dniOffset);
    setWybranaData(d.toISOString().split('T')[0]);
  };

  const formatujDateWyświetlanie = (dataStr: string) => {
    if (dataStr === getDzis()) return 'Dzisiaj';
    const d = new Date(dataStr);
    const wczoraj = new Date();
    wczoraj.setDate(wczoraj.getDate() - 1);
    if (dataStr === wczoraj.toISOString().split('T')[0]) return 'Wczoraj';
    const jutro = new Date();
    jutro.setDate(jutro.getDate() + 1);
    if (dataStr === jutro.toISOString().split('T')[0]) return 'Jutro';
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const posilkiDnia = posilki.filter(p => p.data === wybranaData);
  const treningiDnia = treningiZapis.filter(t => t.data === wybranaData);

  const pobierzPoprzedniWynikDlaSerii = (nazwaCwiczenia: string, nrSerii: number) => {
    const historiaDlaCwiczenia = treningiZapis.filter(t => t.cwiczenie === nazwaCwiczenia && t.data !== wybranaData);
    if (historiaDlaCwiczenia.length === 0) return "-";
    const ostatniTrening = historiaDlaCwiczenia[historiaDlaCwiczenia.length - 1];
    if (!ostatniTrening.serie || !ostatniTrening.serie[nrSerii - 1]) return "-";
    const prevS = ostatniTrening.serie[nrSerii - 1];
    
    if (prevS.dystans || prevS.czas) {
      return `${prevS.dystans ? prevS.dystans : ''} ${prevS.czas ? prevS.czas : ''}`.trim() || "✓";
    }
    return `${prevS.ciezar || 0} x ${prevS.powtorzenia || 0}`;
  };

  const wybierzCwiczenieIZainicjalizuj = (cw: any, aktualnyDzien: any) => {
    setWybraneCwiczenie(cw.nazwa);
    
    const nazwaLower = (cw.nazwa || '').toLowerCase();
    const opisSerii = (cw.opisSerii || cw.opis || cw.serieInfo || '').toString().toLowerCase();
    const dzienTypLower = (aktualnyDzien?.typ || '').toLowerCase();
    const dzienTytulLower = (aktualnyDzien?.tytul || '').toLowerCase();

    let wykrytyTyp: 'silowe' | 'plywanie' | 'cardio' | 'status' = 'silowe';

    const czyBasen = 
      dzienTypLower.includes('basen') || 
      dzienTypLower.includes('pływ') || 
      dzienTytulLower.includes('basen') || 
      dzienTytulLower.includes('pływ') ||
      nazwaLower.includes('pływ') || 
      nazwaLower.includes('kraul') || 
      nazwaLower.includes('grzbiet') || 
      nazwaLower.includes('żabk') || 
      nazwaLower.includes('delfin') || 
      nazwaLower.includes('styl') || 
      nazwaLower.includes('deska') || 
      nazwaLower.includes('deską') || 
      nazwaLower.includes('płetw') || 
      nazwaLower.includes('rozpływ') || 
      nazwaLower.includes('basen');

    const czyCardio = 
      nazwaLower.includes('ergometr') || 
      nazwaLower.includes('wioślarz') || 
      nazwaLower.includes('bieżn') || 
      nazwaLower.includes('rower') || 
      nazwaLower.includes('cardio') || 
      nazwaLower.includes('orbitrek') || 
      nazwaLower.includes('skakank');

    const czyStatus = 
      nazwaLower.includes('rozciąg') || 
      nazwaLower.includes('mobilno') || 
      nazwaLower.includes('spacer') || 
      nazwaLower.includes('plank') || 
      nazwaLower.includes('sauna');

    if (czyBasen) wykrytyTyp = 'plywanie';
    else if (czyCardio) wykrytyTyp = 'cardio';
    else if (czyStatus) wykrytyTyp = 'status';

    setTypCwiczenia(wykrytyTyp);

    let iloscSerii = 1;
    let autoReps = '';
    let autoDystans = '';

    if (cw.serie && !isNaN(Number(cw.serie))) iloscSerii = Number(cw.serie);
    if (cw.powtorzenia) autoReps = cw.powtorzenia.toString();

    const matchNxM = opisSerii.match(/(\d+)\s*[xX×*]\s*([0-9a-zA-Z\-]+)/);
    if (matchNxM) {
      iloscSerii = parseInt(matchNxM[1]) || iloscSerii;
      const parametr = matchNxM[2];
      if (wykrytyTyp === 'plywanie') {
        autoDystans = parametr.includes('m') ? parametr : `${parametr}m`;
      } else {
        autoReps = parametr.replace(/[^0-9\-]/g, '');
      }
    } else {
      const matchDystansSolo = opisSerii.match(/(\d+)\s*m/);
      if (matchDystansSolo) autoDystans = `${matchDystansSolo[1]}m`;
    }

    const finalnaIloscSerii = Math.max(1, Math.min(iloscSerii, 10));

    const noweSerie = Array.from({ length: finalnaIloscSerii }, (_, i) => ({
      set: i + 1,
      ciezar: '',
      powtorzenia: autoReps,
      dystans: autoDystans,
      czas: '',
      ukoczona: false
    }));

    setSerie(noweSerie);
  };

  const dodajSerie = () => {
    const prev = serie[serie.length - 1];
    setSerie([
      ...serie, 
      { 
        set: serie.length + 1, 
        ciezar: prev?.ciezar || '', 
        powtorzenia: prev?.powtorzenia || '', 
        dystans: prev?.dystans || '', 
        czas: '', 
        ukoczona: false 
      }
    ]);
  };

  const zmianaSerii = (index: number, pole: 'ciezar' | 'powtorzenia' | 'dystans' | 'czas', wartosc: string) => {
    const zaktualizowane = [...serie];
    zaktualizowane[index][pole] = wartosc;
    setSerie(zaktualizowane);
  };

  const toggleUkoczona = (index: number) => {
    const zaktualizowane = [...serie];
    zaktualizowane[index].ukoczona = !zaktualizowane[index].ukoczona;
    setSerie(zaktualizowane);
  };

  // ZAPIS TRENINGU DO SUPABASE
  const zapiszWynikTreningu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wybraneCwiczenie) return;
    
    const ukoczoneSerie = serie.filter(s => s.ukoczona);
    if (ukoczoneSerie.length === 0) {
      alert("Zaznacz przynajmniej jedną ukończoną serię (zielony przycisk z fajką), aby zapisać wynik!");
      return;
    }

    let podsumowanieStr = '';
    if (typCwiczenia === 'plywanie') {
      podsumowanieStr = ukoczoneSerie.map(s => `S${s.set}: ${s.dystans || 'Dystans'} ${s.czas ? '(' + s.czas + ')' : ''}`.trim()).join(' | ');
    } else if (typCwiczenia === 'cardio') {
      podsumowanieStr = ukoczoneSerie.map(s => `S${s.set}: ${s.czas ? s.czas + 'min' : ''} ${s.dystans ? '(' + s.dystans + ')' : ''}`.trim() || 'Zaliczone').join(' | ');
    } else if (typCwiczenia === 'status') {
      podsumowanieStr = `Zrobione (${ukoczoneSerie.length} serii)`;
    } else {
      podsumowanieStr = ukoczoneSerie.map(s => `S${s.set}: ${s.ciezar || 0}kg×${s.powtorzenia || 0}`).join(' | ');
    }

    const nowyWynik = {
      id: Date.now(),
      user_id: 'domyslny_uzytkownik',
      cwiczenie: wybraneCwiczenie,
      typ: typCwiczenia,
      serie: ukoczoneSerie,
      data: wybranaData, 
      podsumowanie: podsumowanieStr
    };

    const zaktualizowane = [...treningiZapis, nowyWynik];
    setTreningiZapis(zaktualizowane);
    localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));

    // Zapis do Supabase
    await supabase.from('treningi').insert([nowyWynik]);

    setWybraneCwiczenie('');
  };

  // USUWANIE TRENINGU Z SUPABASE
  const usunWynik = async (id: number) => {
    const zaktualizowane = treningiZapis.filter(t => t.id !== id);
    setTreningiZapis(zaktualizowane);
    localStorage.setItem('moje_treningi_dzis', JSON.stringify(zaktualizowane));

    await supabase.from('treningi').delete().eq('id', id);
  };

  const obliczMakroAI = async () => {
    if (!nazwaPosilku) {
      alert("Wpisz najpierw co zjadłeś (np. 'Makaron z kurczakiem')!");
      return;
    }

    setLadowanieAiPosilek(true);
    try {
      const res = await fetch('/api/asystent/oblicz-makro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          posilek: nazwaPosilku, 
          waga: wagaPosilku 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Błąd obliczeń AI");

      if (data.skorygowanaNazwa) {
        setNazwaPosilku(data.skorygowanaNazwa);
        setWagaPosilku(''); 
      }
      setKalorie(data.kalorie?.toString() || '0');
      setBialko(data.bialko?.toString() || '0');
      setWeglowodany(data.weglowodany?.toString() || '0');
      setTluszcze(data.tluszcze?.toString() || '0');

    } catch (err: any) {
      alert("Błąd: " + err.message);
    } finally {
      setLadowanieAiPosilek(false);
    }
  };

  // ZAPIS POSIŁKU DO SUPABASE
  const dodajPosilek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nazwaPosilku || !kalorie) return;
    
    let finalnaNazwa = nazwaPosilku;
    if (wagaPosilku && !finalnaNazwa.includes(wagaPosilku)) {
      finalnaNazwa = `${finalnaNazwa} (${wagaPosilku}g)`;
    }

    const nowy = {
      id: Date.now(),
      user_id: 'domyslny_uzytkownik',
      nazwa: finalnaNazwa,
      kalorie: Number(kalorie) || 0,
      bialko: Number(bialko) || 0,
      weglowodany: Number(weglowodany) || 0,
      tluszcze: Number(tluszcze) || 0,
      data: wybranaData,
    };

    const zaktualizowane = [...posilki, nowy];
    setPosilki(zaktualizowane);
    localStorage.setItem('moje_posilki_dzis', JSON.stringify(zaktualizowane));
    
    // Zapis do Supabase
    await supabase.from('posilki').insert([nowy]);

    setNazwaPosilku(''); setWagaPosilku(''); setKalorie(''); setBialko(''); setWeglowodany(''); setTluszcze('');
  };

  // USUWANIE POSIŁKU Z SUPABASE
  const usunPosilek = async (id: number) => {
    const zaktualizowane = posilki.filter(p => p.id !== id);
    setPosilki(zaktualizowane);
    localStorage.setItem('moje_posilki_dzis', JSON.stringify(zaktualizowane));

    await supabase.from('posilki').delete().eq('id', id);
  };

  const dniTreningowe = plan?.treningiTygodnia || [];
  const aktualnyDzienObj = dniTreningowe[wybranyDzienIdx];

  const sumaKcal = posilkiDnia.reduce((acc, curr) => acc + (Number(curr.kalorie) || 0), 0);
  const sumaBialko = posilkiDnia.reduce((acc, curr) => acc + (Number(curr.bialko) || 0), 0);
  const sumaWegle = posilkiDnia.reduce((acc, curr) => acc + (Number(curr.weglowodany) || 0), 0);
  const sumaTluszcze = posilkiDnia.reduce((acc, curr) => acc + (Number(curr.tluszcze) || 0), 0);

  const celKcal = plan?.makroskladniki?.kalorieKcal || 2250;
  const celBialko = plan?.makroskladniki?.bialkoGramy || 170;
  const celWegle = plan?.makroskladniki?.weglowodanyGramy || 240;
  const celTluszcze = plan?.makroskladniki?.tluszczeGramy || 70;
  
  const zostaloKcal = celKcal - sumaKcal;

  return (
    <div className="max-w-2xl mx-auto p-6 text-white min-h-screen bg-zinc-950 space-y-6 pb-16">
      {/* NAGŁÓWEK */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-xl flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">Twój Pulpit</h1>
          <p className="text-xs text-zinc-400">Zsynchronizowano z bazą w chmurze ☁️</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Link href="/pomiary" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow">
            📈 Pomiary
          </Link>
          <Link href="/edytor-planu" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow">
            ✏️ Edytor
          </Link>
          <Link href="/skaner" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium px-3 py-2 rounded-xl transition">
            📷 Skaner
          </Link>
        </div>
      </div>

      {/* KALENDARZ */}
      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-3 rounded-2xl shadow-xl">
        <button onClick={() => zmienDate(-1)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-xs font-bold transition">
          ← Wczoraj
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Wybrany dzień</p>
          <p className="text-sm font-bold text-emerald-400">{formatujDateWyświetlanie(wybranaData)}</p>
        </div>
        <button onClick={() => zmienDate(1)} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-xs font-bold transition">
          Jutro →
        </button>
      </div>

      {/* LICZNIK KALORII I MAKRO */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Zjedzone w ten dzień</p>
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

        <div className="grid grid-cols-3 gap-2 text-center pt-2">
          <div className="bg-zinc-800/40 rounded-xl p-2 border border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Białko</p>
            <p className="text-sm font-bold text-indigo-400">{sumaBialko}g <span className="text-[10px] text-zinc-500 font-normal">/ {celBialko}g</span></p>
          </div>
          <div className="bg-zinc-800/40 rounded-xl p-2 border border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Tłuszcz</p>
            <p className="text-sm font-bold text-rose-400">{sumaTluszcze}g <span className="text-[10px] text-zinc-500 font-normal">/ {celTluszcze}g</span></p>
          </div>
          <div className="bg-zinc-800/40 rounded-xl p-2 border border-zinc-800">
            <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Węgle</p>
            <p className="text-sm font-bold text-amber-400">{sumaWegle}g <span className="text-[10px] text-zinc-500 font-normal">/ {celWegle}g</span></p>
          </div>
        </div>
      </div>

      {/* SEKCJA TRENINGU */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl space-y-5">
        <h2 className="text-lg font-bold text-emerald-400">💪 Trening</h2>
        
        {dniTreningowe.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-zinc-400 text-sm">Brak wygenerowanego planu treningowego.</p>
          </div>
        ) : (
          <div className="space-y-4">
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

            {aktualnyDzienObj && (
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div>
                  <h3 className="font-bold text-white text-sm">{aktualnyDzienObj.tytul} <span className="text-xs text-emerald-400 font-normal">({aktualnyDzienObj.akcent})</span></h3>
                  <p className="text-xs text-zinc-400">Wybierz ćwiczenie, aby zarejestrować serie:</p>
                </div>

                <div className="space-y-2">
                  {aktualnyDzienObj.cwiczeniaIZadania?.map((cw: any, cIdx: number) => {
                    const isSelected = wybraneCwiczenie === cw.nazwa;
                    const wczesniejszeTreningi = treningiZapis.filter(t => t.cwiczenie === cw.nazwa && t.data < wybranaData);
                    const ostatniTrening = wczesniejszeTreningi.length > 0 ? wczesniejszeTreningi[wczesniejszeTreningi.length - 1] : null;
                    const ostatniStatus = ostatniTrening ? `Ostatnio (${ostatniTrening.data}): ${ostatniTrening.podsumowanie}` : "Brak historii – zacznij działać!";

                    return (
                      <div 
                        key={cIdx}
                        onClick={() => wybierzCwiczenieIZainicjalizuj(cw, aktualnyDzienObj)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 ${isSelected ? 'bg-emerald-950/40 border-emerald-500 shadow' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-xs">{cw.nazwa}</span>
                          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">Plan: {cw.opisSerii || (cw.serie && cw.powtorzenia ? `${cw.serie}x${cw.powtorzenia}` : '')}</span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium">{ostatniStatus}</p>
                      </div>
                    );
                  })}
                </div>

                {wybraneCwiczenie && (
                  <div className="bg-zinc-900 p-4 rounded-xl border border-emerald-500/50 space-y-3 mt-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-white">Rejestrujesz: <span className="text-emerald-400">{wybraneCwiczenie}</span></p>
                      <button onClick={() => setWybraneCwiczenie('')} className="text-xs text-zinc-500 hover:text-white">Zamknij</button>
                    </div>

                    {/* DYNAMICZNE NAGŁÓWKI */}
                    <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-400 uppercase font-bold text-center pt-2">
                      <span className="col-span-1">SET</span>
                      <span className="col-span-3">PREV</span>
                      {typCwiczenia === 'silowe' && (
                        <>
                          <span className="col-span-3">KG</span>
                          <span className="col-span-3">POWT</span>
                        </>
                      )}
                      {typCwiczenia === 'plywanie' && (
                        <>
                          <span className="col-span-4">DYSTANS</span>
                          <span className="col-span-2">CZAS</span>
                        </>
                      )}
                      {typCwiczenia === 'cardio' && (
                        <>
                          <span className="col-span-3">CZAS</span>
                          <span className="col-span-3">DYSTANS</span>
                        </>
                      )}
                      {typCwiczenia === 'status' && (
                        <span className="col-span-6">ZALICZENIE</span>
                      )}
                      <span className="col-span-2 text-right pr-2">STATUS</span>
                    </div>

                    {/* WIERSZE SERII */}
                    {serie.map((s, idx) => {
                      const prevWynik = pobierzPoprzedniWynikDlaSerii(wybraneCwiczenie, s.set);

                      return (
                        <div key={idx} className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-lg transition ${s.ukoczona ? 'bg-emerald-950/40 border border-emerald-500/30' : 'bg-zinc-800/40'}`}>
                          <span className="col-span-1 text-xs font-bold text-emerald-400 text-center">{s.set}</span>
                          <span className="col-span-3 text-[11px] text-zinc-400 text-center truncate">{prevWynik}</span>

                          {/* SIŁOWNIA */}
                          {typCwiczenia === 'silowe' && (
                            <>
                              <div className="col-span-3">
                                <input 
                                  type="number" step="0.5" value={s.ciezar} 
                                  onChange={(e) => zmianaSerii(idx, 'ciezar', e.target.value)}
                                  placeholder="kg" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="text" value={s.powtorzenia} 
                                  onChange={(e) => zmianaSerii(idx, 'powtorzenia', e.target.value)}
                                  placeholder="reps" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                                />
                              </div>
                            </>
                          )}

                          {/* PŁYWANIE */}
                          {typCwiczenia === 'plywanie' && (
                            <>
                              <div className="col-span-4">
                                <input 
                                  type="text" value={s.dystans} 
                                  onChange={(e) => zmianaSerii(idx, 'dystans', e.target.value)}
                                  placeholder="np. 100m" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                                />
                              </div>
                              <div className="col-span-2">
                                <input 
                                  type="text" value={s.czas} 
                                  onChange={(e) => zmianaSerii(idx, 'czas', e.target.value)}
                                  placeholder="min:s" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                                />
                              </div>
                            </>
                          )}

                          {/* CARDIO */}
                          {typCwiczenia === 'cardio' && (
                            <>
                              <div className="col-span-3">
                                <input 
                                  type="text" value={s.czas} 
                                  onChange={(e) => zmianaSerii(idx, 'czas', e.target.value)}
                                  placeholder="min" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                                />
                              </div>
                              <div className="col-span-3">
                                <input 
                                  type="text" value={s.dystans} 
                                  onChange={(e) => zmianaSerii(idx, 'dystans', e.target.value)}
                                  placeholder="dystans" className="w-full bg-zinc-800 border border-zinc-700 rounded p-1.5 text-center text-white text-xs font-bold"
                                />
                              </div>
                            </>
                          )}

                          {/* STATUS */}
                          {typCwiczenia === 'status' && (
                            <div className="col-span-6 text-center text-xs text-zinc-400">
                              Odhacz wykonanie
                            </div>
                          )}

                          <div className="col-span-2 flex justify-end pr-2">
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

                    <button type="button" onClick={dodajSerie} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 rounded-lg text-xs transition border border-zinc-700">
                      + ADD SET
                    </button>

                    <button type="button" onClick={zapiszWynikTreningu} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs transition shadow">
                      Zapisz ukończone serie w tym dniu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {treningiDnia.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase">Serie zapisane w tym dniu:</h3>
            {treningiDnia.map((t) => (
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
        <h2 className="text-lg font-bold text-white flex items-center justify-between">
          <span>🥗 Dodaj Posiłek</span>
        </h2>
        <form onSubmit={dodajPosilek} className="space-y-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-zinc-400 mb-1 block">Co zjadłeś?</label>
              <input 
                type="text" value={nazwaPosilku} onChange={(e) => setNazwaPosilku(e.target.value)}
                placeholder="np. Łosoś z ryżem" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white" required
              />
            </div>
            <div className="w-24">
              <label className="text-[10px] text-zinc-400 mb-1 block">Waga (g)</label>
              <input 
                type="number" value={wagaPosilku} onChange={(e) => setWagaPosilku(e.target.value)}
                placeholder="g" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-white text-center"
              />
            </div>
            <button 
              type="button" 
              onClick={obliczMakroAI} 
              disabled={ladowanieAiPosilek}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition shadow flex items-center justify-center min-w-[60px]"
            >
              {ladowanieAiPosilek ? '⏳' : '✨ AI'}
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="text-[10px] text-zinc-400 mb-1 block">Kcal</label>
              <input 
                type="number" value={kalorie} onChange={(e) => setKalorie(e.target.value)}
                placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white text-center" required
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 mb-1 block">Białko (g)</label>
              <input 
                type="number" value={bialko} onChange={(e) => setBialko(e.target.value)}
                placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 mb-1 block">Tłuszcze (g)</label>
              <input 
                type="number" value={tluszcze} onChange={(e) => setTluszcze(e.target.value)}
                placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white text-center"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 mb-1 block">Węgle (g)</label>
              <input 
                type="number" value={weglowodany} onChange={(e) => setWeglowodany(e.target.value)}
                placeholder="0" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white text-center"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-2.5 rounded-xl text-xs transition">
            Zapisz posiłek w dacie: {formatujDateWyświetlanie(wybranaData)}
          </button>
        </form>

        <div className="space-y-2 pt-2">
          {posilkiDnia.map((p) => (
            <div key={p.id} className="bg-zinc-800/40 border border-zinc-800 p-2.5 rounded-xl flex justify-between items-center text-xs">
              <div>
                <span className="font-bold text-white">{p.nazwa}</span>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  <span className="text-emerald-400 font-medium">{p.kalorie} kcal</span>
                  {p.bialko > 0 || p.weglowodany > 0 || p.tluszcze > 0 
                    ? ` (B: ${p.bialko || 0}g, T: ${p.tluszcze || 0}g, W: ${p.weglowodany || 0}g)` 
                    : ''}
                </p>
              </div>
              <button onClick={() => usunPosilek(p.id)} className="text-zinc-500 hover:text-red-400 px-2 py-1">✕</button>
            </div>
          ))}
          {posilkiDnia.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-2">Brak posiłków dla wybranej daty.</p>
          )}
        </div>
      </div>
    </div>
  );
}