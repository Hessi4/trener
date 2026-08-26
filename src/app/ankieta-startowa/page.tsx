// src/app/ankieta-startowa/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
import { getActiveUserId } from '@/app/lib/user';
import { 
  ProfilUzytkownikaRozszerzony, 
  CelGlowny, 
  SprzetGarazowy, 
  StylPlywacki, 
  AkcesoriaPlywackie,
  PoziomPlywania,
  Plec,
  PoziomAktywnosci,
  DzienHarmonogramu
} from '@/app/typy/uzytkownik';
import { 
  Flame, Activity, Trophy, HeartPulse, 
  ArrowRight, ArrowLeft, CheckCircle2, Ruler, Loader2, Calendar
} from 'lucide-react';

const CELE: { id: CelGlowny; tytul: string; opis: string; ikona: any }[] = [
  { id: 'redukcja_tluszczu', tytul: 'Redukcja i Rzeźba', opis: 'Spalanie tkanki tłuszczowej, ochrona mięśni i ujemny bilans kaloryczny.', ikona: Flame },
  { id: 'rekompozycja_forma', tytul: 'Rekompozycja Sylwetki', opis: 'Budowa siły z równoległym spadkiem obwodów.', ikona: Activity },
  { id: 'poprawa_wydolnosci', tytul: 'Wydolność Hybrydowa', opis: 'Maksimum tlenowe i tempo w wodzie.', ikona: Trophy },
];

const SPRZET_SILOWNIA: { id: SprzetGarazowy; nazwa: string; kat: string }[] = [
  // Wolne ciężary
  { id: 'hantle_regulowane', nazwa: 'Hantle regulowane / zwykłe', kat: 'Wolne ciężary' },
  { id: 'kettlebells', nazwa: 'Kettlebells (Odważniki kulowe)', kat: 'Wolne ciężary' },
  { id: 'gryf_prosty_olimpijski', nazwa: 'Gryf olimpijski (50mm)', kat: 'Wolne ciężary' },
  { id: 'gryf_prosty_zwykly', nazwa: 'Gryf prosty (28/30mm)', kat: 'Wolne ciężary' },
  { id: 'gryf_lamany', nazwa: 'Gryf łamany (biceps/triceps)', kat: 'Wolne ciężary' },
  // Stanowiska
  { id: 'lawka_regulowana_katy', nazwa: 'Ławka regulowana', kat: 'Stanowiska' },
  { id: 'stojaki_do_przysiadow', nazwa: 'Stojaki pod sztangę / klatka', kat: 'Stanowiska' },
  { id: 'maszyna_smitha', nazwa: 'Maszyna Smitha', kat: 'Stanowiska' },
  // Masa ciała
  { id: 'drazek_do_podciagania', nazwa: 'Drążek do podciągania', kat: 'Masa ciała' },
  { id: 'porecze_dipsy', nazwa: 'Poręcze stacjonarne do dipsów', kat: 'Masa ciała' },
  // Maszyny i wyciągi
  { id: 'wyciag_gorny', nazwa: 'Wyciąg górny (lat pulldown)', kat: 'Wyciągi' },
  { id: 'wyciag_dolny', nazwa: 'Wyciąg dolny (wiosłowanie)', kat: 'Wyciągi' },
  { id: 'wyciag_brama', nazwa: 'Brama (podwójny wyciąg)', kat: 'Wyciągi' },
  { id: 'suwnica_nogi', nazwa: 'Suwnica na nogi (Leg press)', kat: 'Maszyny' },
  { id: 'maszyna_klatka_rozpietki', nazwa: 'Maszyna na klatkę (Pec deck)', kat: 'Maszyny' },
  { id: 'maszyna_plecy_wioslo', nazwa: 'Maszyna do wiosłowania siedząc', kat: 'Maszyny' },
  { id: 'maszyna_nogi_czworoglowe', nazwa: 'Maszyna wyprosty nóg (czwórki)', kat: 'Maszyny' },
  { id: 'maszyna_nogi_dwuglowe', nazwa: 'Maszyna ugięcia nóg (dwójki)', kat: 'Maszyny' },
  { id: 'maszyna_lydki', nazwa: 'Wspięcia na łydki (maszyna)', kat: 'Maszyny' },
  // Akcesoria wyciągu
  { id: 'uchwyt_sznur_triceps', nazwa: 'Uchwyt sznur / lina', kat: 'Akcesoria wyciągu' },
  { id: 'uchwyt_drazek_szeroki', nazwa: 'Drążek szeroki do wyciągu', kat: 'Akcesoria wyciągu' },
  { id: 'uchwyt_trojkat_wioslo', nazwa: 'Uchwyt trójkątny (wąski)', kat: 'Akcesoria wyciągu' },
  // Dodatki
  { id: 'gumy_oporowe_powerband', nazwa: 'Gumy oporowe (Powerband)', kat: 'Akcesoria' },
  { id: 'pas_obciazeniowy', nazwa: 'Pas pod obciążenie', kat: 'Akcesoria' },
  // Cardio
  { id: 'rowerek_stacjonarny', nazwa: 'Rowerek stacjonarny', kat: 'Cardio' },
  { id: 'bieznia', nazwa: 'Bieżnia', kat: 'Cardio' },
  { id: 'ergometr_wioslarski', nazwa: 'Ergometr Wioślarski', kat: 'Cardio' },
];

const AKCESORIA_BASEN: { id: AkcesoriaPlywackie; nazwa: string }[] = [
  { id: 'deska', nazwa: 'Deska do pływania' },
  { id: 'ósemka_pullbuoy', nazwa: 'Ósemka (Pullbuoy)' },
  { id: 'pletwy_krotkie', nazwa: 'Płetwy krótkie (treningowe)' },
  { id: 'lapki_duze', nazwa: 'Łapki duże (siłowe)' },
  { id: 'lapki_male_techniczne', nazwa: 'Łapki małe (czucie wody)' },
  { id: 'rurka_czolowa', nazwa: 'Rurka czołowa (snurkel)' },
  { id: 'stoper_zegarek', nazwa: 'Zegarek / stoper do interwałów' },
];

const STYLE_BASEN: { id: StylPlywacki; nazwa: string }[] = [
  { id: 'kraul', nazwa: 'Kraul (Dowolny)' },
  { id: 'grzbiet', nazwa: 'Grzbietowy' },
  { id: 'klasyczny', nazwa: 'Klasyczny (Żabka)' },
  { id: 'motylkowy', nazwa: 'Motylkowy (Delfin)' },
];

const DNI_TYGODNIA = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'] as const;

export default function AnkietaStartowa() {
  const router = useRouter();
  const [krok, setKrok] = useState<number>(1);
  const [ladowanie, setLadowanie] = useState<boolean>(false);
  const [zamontowano, setZamontowano] = useState<boolean>(false);

  const [dane, setDane] = useState<ProfilUzytkownikaRozszerzony>({
    plec: 'mezczyzna',
    poziomAktywnosci: 'umiarkowana',
    celGlowny: 'redukcja_tluszczu',
    wiek: 23,
    wzrostCm: 180,
    wagaAktualnaKg: 85,
    wagaDocelowaKg: 78,
    pomiary: { 
      klatkaCm: 104, 
      pasTaliaCm: 88, 
      biodraCm: 98, 
      karkSzyjaCm: 39,
      bicepsCm: 38, 
      udoCm: 60,
      lydkaCm: 38,
      przedramieCm: 30
    },
    zdrowieIKontuzje: '',
    sprzet: [
      'hantle_regulowane', 
      'gryf_prosty_zwykly', 
      'lawka_regulowana_katy', 
      'wyciag_gorny', 
      'drazek_do_podciagania',
    ],
    szczegolySilowni: { maksObciazenieGryfKg: 90, maksHantleKg: 24, skosUjemnyLawka: false },
    basen: {
      poziom: 'sredniozaawansowany',
      znaneStyle: ['kraul'],
      akcesoria: [],
      czasNajszybsze50mKraul: '',
      tempo100mKraulKomfort: '2:00',
      czasNa400mKraul: '',
      sredniaObjetoscSesjiMetry: 1500,
      maksDystansCiaglyMetry: 1000,
      dlugoscBasenuMetry: 25,
      umiejetnoscNawrotuKozilkowego: false,
      skupienie: 'tempo_interwaly',
    },
    harmonogram: DNI_TYGODNIA.map(dzien => ({
      dzienTygodnia: dzien,
      rodzajTreningu: 'Wolne'
    }))
  });

  useEffect(() => {
    setZamontowano(true);
    const userId = getActiveUserId();
    const zapisaneAutosave = localStorage.getItem(`autosave_ankieta_${userId}`) || localStorage.getItem('autosave_ankieta');
    if (zapisaneAutosave) {
      try {
        const pobraneDane = JSON.parse(zapisaneAutosave);
        
        // AUTO-NAPRAWA: Łączymy stare dane z nowymi strukturami (żeby uniknąć crasha)
        setDane(aktualne => ({
          ...aktualne,
          ...pobraneDane,
          harmonogram: pobraneDane.harmonogram || aktualne.harmonogram,
          pomiary: { ...aktualne.pomiary, ...(pobraneDane.pomiary || {}) },
          basen: { ...aktualne.basen, ...(pobraneDane.basen || {}) }
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (zamontowano) {
      const userId = getActiveUserId();
      localStorage.setItem(`autosave_ankieta_${userId}`, JSON.stringify(dane));
      localStorage.setItem('autosave_ankieta', JSON.stringify(dane));
    }
  }, [dane, zamontowano]);

  if (!zamontowano) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-sm">Wczytywanie formularza...</div>;
  }

  const przelaczElement = <T,>(lista: T[], element: T): T[] => {
    return lista.includes(element) ? lista.filter((i) => i !== element) : [...lista, element];
  };

  const ustawDzienHarmonogramu = (dzienTygodnia: string, rodzajTreningu: 'Siłownia' | 'Basen' | 'Cardio' | 'Wolne') => {
    const bezpiecznyHarmonogram = dane.harmonogram || DNI_TYGODNIA.map(d => ({ dzienTygodnia: d, rodzajTreningu: 'Wolne' }));
    
    const noweDni = bezpiecznyHarmonogram.map(d => 
      d.dzienTygodnia === dzienTygodnia ? { ...d, rodzajTreningu } : d
    );
    setDane({ ...dane, harmonogram: noweDni });
  };

  const zakonczAnkiete = async () => {
    setLadowanie(true);
    try {
      const userId = getActiveUserId();
      localStorage.setItem(`profil_uzytkownika_${userId}`, JSON.stringify(dane));
      localStorage.setItem('profil_uzytkownika', JSON.stringify(dane));

      const dzisiejszaData = new Date().toISOString().split('T')[0];
      const zmapowanePomiary = [
        { id: Date.now() + 1, kategoria: 'Masa ciała', wartosc: dane.wagaAktualnaKg || 0, data: dzisiejszaData },
        { id: Date.now() + 2, kategoria: 'Klatka piersiowa', wartosc: dane.pomiary.klatkaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 3, kategoria: 'Talia', wartosc: dane.pomiary.pasTaliaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 4, kategoria: 'Biodra', wartosc: dane.pomiary.biodraCm || 0, data: dzisiejszaData },
        { id: Date.now() + 5, kategoria: 'Szyja/kark', wartosc: dane.pomiary.karkSzyjaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 6, kategoria: 'Ramię/biceps', wartosc: dane.pomiary.bicepsCm || 0, data: dzisiejszaData },
        { id: Date.now() + 7, kategoria: 'Udo', wartosc: dane.pomiary.udoCm || 0, data: dzisiejszaData },
        { id: Date.now() + 8, kategoria: 'Łydka', wartosc: dane.pomiary.lydkaCm || 0, data: dzisiejszaData }
      ].filter(p => p.wartosc > 0);

      const istniejacePomiary = JSON.parse(localStorage.getItem(`historia_pomiarow_szczegolowa_${userId}`) || localStorage.getItem('historia_pomiarow_szczegolowa') || '[]');
      const bezWypelniaczy = istniejacePomiary.filter((p: any) => p.data !== '2026-05-01' && p.data !== '2026-06-01' && p.data !== '2026-07-01');
      const zaktualizowanePomiary = [...bezWypelniaczy, ...zmapowanePomiary];
      
      localStorage.setItem(`historia_pomiarow_szczegolowa_${userId}`, JSON.stringify(zaktualizowanePomiary));
      localStorage.setItem('historia_pomiarow_szczegolowa', JSON.stringify(zaktualizowanePomiary));

      const res = await fetch('/api/asystent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dane),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Nieznany błąd serwera');
      }

      localStorage.setItem(`wygenerowany_plan_ai_${userId}`, JSON.stringify(json));
      localStorage.setItem('wygenerowany_plan_ai', JSON.stringify(json));
      localStorage.removeItem(`autosave_ankieta_${userId}`);
      localStorage.removeItem('autosave_ankieta');

      // ZAPIS PLANU DO CHMURY SUPABASE DLA KONKRETNEGO PROFILU
      await supabase.from('plany').upsert({
        id: userId,
        dane_planu: json,
        zaktualizowano_at: new Date().toISOString()
      });

      router.push('/');
      
    } catch (err: any) {
      console.error('Błąd ankiety:', err);
      alert(`Błąd: ${err.message}`);
    } finally {
      setLadowanie(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-28 max-w-lg mx-auto flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Krok {krok} z 5
          </span>
          <span className="text-[10px] text-slate-400 font-medium text-right">
            {krok === 1 && 'Podstawy (Płeć, Aktywność, Cel)'}
            {krok === 2 && 'Pomiary ciała'}
            {krok === 3 && 'Zdrowie i Basen'}
            {krok === 4 && 'Inwentarz Siłowni'}
            {krok === 5 && 'Harmonogram Treningowy'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-300 rounded-full" style={{ width: `${(krok / 5) * 100}%` }} />
        </div>

        {/* KROK 1 */}
        {krok === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Podstawy profilu</h1>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <label className="text-xs text-slate-400 block mb-2 font-medium">Płeć (wpływa na BMR):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDane({...dane, plec: 'mezczyzna'})}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${dane.plec === 'mezczyzna' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  Mężczyzna
                </button>
                <button
                  type="button"
                  onClick={() => setDane({...dane, plec: 'kobieta'})}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${dane.plec === 'kobieta' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  Kobieta
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <label className="text-xs text-slate-400 block mb-1 font-medium">Tryb życia (Poziom aktywności):</label>
              {([
                { id: 'siedzaca', label: 'Siedzący', desc: 'Praca za biurkiem, mało ruchu' },
                { id: 'lekka', label: 'Lekki', desc: '1-2 lekkie treningi, praca biurowa' },
                { id: 'umiarkowana', label: 'Umiarkowany', desc: '3-4 treningi, mieszany ruch' },
                { id: 'wysoka', label: 'Wysoki', desc: 'Praca fizyczna / bardzo częste treningi' },
              ] as const).map(akt => (
                <button
                  key={akt.id}
                  type="button"
                  onClick={() => setDane({...dane, poziomAktywnosci: akt.id})}
                  className={`w-full text-left p-2.5 rounded-xl border flex justify-between items-center transition-all ${dane.poziomAktywnosci === akt.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
                >
                  <div>
                    <span className="font-semibold block text-sm">{akt.label}</span>
                    <span className="text-[10px] opacity-70">{akt.desc}</span>
                  </div>
                  {dane.poziomAktywnosci === akt.id && <span>✓</span>}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400 block font-medium">Cel główny:</label>
              {CELE.map((c) => {
                const Ikona = c.ikona;
                const wybrany = dane.celGlowny === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDane({ ...dane, celGlowny: c.id })}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      wybrany ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${wybrany ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Ikona className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-white">{c.tytul}</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">{c.opis}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400">Waga obecna (kg)</label>
                <input type="number" value={dane.wagaAktualnaKg || ''} onChange={(e) => setDane({ ...dane, wagaAktualnaKg: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Waga cel (kg)</label>
                <input type="number" value={dane.wagaDocelowaKg || ''} onChange={(e) => setDane({ ...dane, wagaDocelowaKg: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Wiek (lata)</label>
                <input type="number" value={dane.wiek || ''} onChange={(e) => setDane({ ...dane, wiek: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1" />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Wzrost (cm)</label>
                <input type="number" value={dane.wzrostCm || ''} onChange={(e) => setDane({ ...dane, wzrostCm: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1" />
              </div>
            </div>
          </div>
        )}

        {krok === 2 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Pomiary ciała (cm)</h1>
            <p className="text-xs text-slate-400">Wpisz obwody, aby aplikacja mogła generować dla Ciebie wykresy postępów.</p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-1.5 mb-4 text-emerald-400 text-sm font-semibold">
                <Ruler className="w-4 h-4" />
                <span>Dokładne obwody</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400">Klatka piersiowa</label>
                  <input type="number" value={dane.pomiary.klatkaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, klatkaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Pas / Talia (pępek)</label>
                  <input type="number" value={dane.pomiary.pasTaliaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, pasTaliaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Biodra / Pośladki</label>
                  <input type="number" value={dane.pomiary.biodraCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, biodraCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Ramię / Biceps</label>
                  <input type="number" placeholder="Największy obwód" value={dane.pomiary.bicepsCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, bicepsCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Udo</label>
                  <input type="number" placeholder="Najgrubsze miejsce" value={dane.pomiary.udoCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, udoCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Łydka</label>
                  <input type="number" value={dane.pomiary.lydkaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, lydkaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Kark / Szyja</label>
                  <input type="number" value={dane.pomiary.karkSzyjaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, karkSzyjaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Przedramię</label>
                  <input type="number" value={dane.pomiary.przedramieCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, przedramieCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {krok === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Zdrowie i Basen</h1>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <HeartPulse className="w-4 h-4" />
                <span>Urazy, przebyte kontuzje, wrażliwe stawy</span>
              </div>
              <textarea
                rows={3}
                placeholder="np. wrażliwe lędźwie przy ciężkim martwym ciągu..."
                value={dane.zdrowieIKontuzje}
                onChange={(e) => setDane({ ...dane, zdrowieIKontuzje: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-red-400"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-cyan-400">Parametry pływackie (jeśli trenujesz)</h2>
              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">Poziom zaawansowania:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['poczatkujacy', 'sredniozaawansowany', 'zaawansowany', 'zawodnik_masters'] as PoziomPlywania[]).map((p) => (
                    <button 
                      key={p} 
                      type="button"
                      onClick={() => setDane({ ...dane, basen: { ...dane.basen, poziom: p } })} 
                      className={`p-2 rounded-xl border text-[11px] transition-all ${dane.basen.poziom === p ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
                    >
                      {p === 'poczatkujacy' && 'Początkujący'}
                      {p === 'sredniozaawansowany' && 'Średni'}
                      {p === 'zaawansowany' && 'Zaawansowany'}
                      {p === 'zawodnik_masters' && 'Masters'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">Opanowane style:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLE_BASEN.map((styl) => (
                    <button 
                      key={styl.id} 
                      type="button"
                      onClick={() => setDane({ ...dane, basen: { ...dane.basen, znaneStyle: przelaczElement(dane.basen.znaneStyle, styl.id) } })} 
                      className={`p-2 rounded-xl border text-[11px] transition-all ${dane.basen.znaneStyle.includes(styl.id) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}
                    >
                      {styl.nazwa} {dane.basen.znaneStyle.includes(styl.id) && '✓'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400">Tempo komfort (100m kraul)</label>
                  <input type="text" value={dane.basen.tempo100mKraulKomfort} onChange={(e) => setDane({ ...dane, basen: { ...dane.basen, tempo100mKraulKomfort: e.target.value } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Średnia objętość sesji (m)</label>
                  <input type="number" value={dane.basen.sredniaObjetoscSesjiMetry} onChange={(e) => setDane({ ...dane, basen: { ...dane.basen, sredniaObjetoscSesjiMetry: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs mt-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {krok === 4 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Dostępny inwentarz</h1>
            <p className="text-xs text-slate-400">Zaznacz wszystko, co masz na siłowni, żeby AI mogło wpleść te maszyny w plan.</p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                {SPRZET_SILOWNIA.map((sprzet) => {
                  const zaznaczony = dane.sprzet.includes(sprzet.id);
                  return (
                    <button 
                      key={sprzet.id} 
                      type="button"
                      onClick={() => setDane({ ...dane, sprzet: przelaczElement(dane.sprzet, sprzet.id) })} 
                      className={`w-full flex justify-between p-2.5 rounded-xl border text-xs transition-all ${zaznaczony ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'}`}>
                      <div className="text-left">
                        <span className="font-medium block">{sprzet.nazwa}</span>
                        <span className="text-[10px] text-slate-500">{sprzet.kat}</span>
                      </div>
                      <span>{zaznaczony ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400">Maks. waga 1 hantli (kg)</label>
                  <input type="number" value={dane.szczegolySilowni.maksHantleKg || ''} onChange={(e) => setDane({ ...dane, szczegolySilowni: { ...dane.szczegolySilowni, maksHantleKg: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs mt-1" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Maks. ciężar na gryf (kg)</label>
                  <input type="number" value={dane.szczegolySilowni.maksObciazenieGryfKg || ''} onChange={(e) => setDane({ ...dane, szczegolySilowni: { ...dane.szczegolySilowni, maksObciazenieGryfKg: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs mt-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {krok === 5 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="text-emerald-400 w-6 h-6" /> Twój harmonogram
            </h1>
            <p className="text-xs text-slate-400 mb-4">
              Zaznacz, w które dni chcesz wykonywać określone typy treningów. AI ułoży plan **wyłącznie** na wskazane przez Ciebie aktywności!
            </p>

            <div className="space-y-2.5">
              {DNI_TYGODNIA.map(dzien => {
                const bezpiecznyHarmonogram = dane.harmonogram || [];
                const aktualnyRodzaj = bezpiecznyHarmonogram.find(d => d.dzienTygodnia === dzien)?.rodzajTreningu || 'Wolne';

                return (
                  <div key={dzien} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
                    <span className="text-xs font-bold text-slate-300 block mb-2">{dzien}</span>
                    <div className="grid grid-cols-4 gap-1">
                      {(['Siłownia', 'Basen', 'Cardio', 'Wolne'] as const).map(rodzaj => (
                        <button
                          key={rodzaj}
                          type="button"
                          onClick={() => ustawDzienHarmonogramu(dzien, rodzaj)}
                          className={`py-1.5 text-[10px] font-medium rounded-lg border transition-all ${
                            aktualnyRodzaj === rodzaj 
                              ? (rodzaj === 'Wolne' ? 'bg-slate-700 text-white border-slate-600' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500')
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {rodzaj}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Nawigacja Dolna */}
      <div className="flex items-center gap-3 pt-6">
        {krok > 1 && (
          <button
            type="button"
            disabled={ladowanie}
            onClick={() => setKrok(krok - 1)}
            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        {krok < 5 ? (
          <button
            type="button"
            onClick={() => setKrok(krok + 1)}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Dalej</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={ladowanie}
            onClick={zakonczAnkiete}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            {ladowanie ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-emerald-950" />
                <span className="text-emerald-950">AI układa plan...</span>
              </>
            ) : (
              <>
                <span>Generuj plan AI</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </main>
  );
}