// src/app/ankieta-startowa/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';
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
  ArrowRight, ArrowLeft, CheckCircle2, Ruler, Loader2, Calendar, Trash2, Sparkles
} from 'lucide-react';

const CELE: { id: CelGlowny; tytul: string; opis: string; ikona: any }[] = [
  { id: 'redukcja_tluszczu', tytul: 'Redukcja i Rzeźba', opis: 'Spalanie tkanki tłuszczowej, ochrona mięśni i ujemny bilans kaloryczny.', ikona: Flame },
  { id: 'rekompozycja_forma', tytul: 'Rekompozycja Sylwetki', opis: 'Budowa siły z równoległym spadkiem obwodów.', ikona: Activity },
  { id: 'poprawa_wydolnosci', tytul: 'Wydolność Hybrydowa', opis: 'Maksimum tlenowe i tempo w wodzie.', ikona: Trophy },
];

const SPRZET_SILOWNIA: { id: SprzetGarazowy; nazwa: string; kat: string }[] = [
  { id: 'hantle_regulowane', nazwa: 'Hantle regulowane / zwykłe', kat: 'Wolne ciężary' },
  { id: 'kettlebells', nazwa: 'Kettlebells (Odważniki kulowe)', kat: 'Wolne ciężary' },
  { id: 'gryf_prosty_olimpijski', nazwa: 'Gryf olimpijski (50mm)', kat: 'Wolne ciężary' },
  { id: 'gryf_prosty_zwykly', nazwa: 'Gryf prosty (28/30mm)', kat: 'Wolne ciężary' },
  { id: 'gryf_lamany', nazwa: 'Gryf łamany (biceps/triceps)', kat: 'Wolne ciężary' },
  { id: 'lawka_regulowana_katy', nazwa: 'Ławka regulowana', kat: 'Stanowiska' },
  { id: 'stojaki_do_przysiadow', nazwa: 'Stojaki pod sztangę / klatka', kat: 'Stanowiska' },
  { id: 'maszyna_smitha', nazwa: 'Maszyna Smitha', kat: 'Stanowiska' },
  { id: 'drazek_do_podciagania', nazwa: 'Drążek do podciągania', kat: 'Masa ciała' },
  { id: 'porecze_dipsy', nazwa: 'Poręcze stacjonarne do dipsów', kat: 'Masa ciała' },
  { id: 'wyciag_gorny', nazwa: 'Wyciąg górny (lat pulldown)', kat: 'Wyciągi' },
  { id: 'wyciag_dolny', nazwa: 'Wyciąg dolny (wiosłowanie)', kat: 'Wyciągi' },
  { id: 'wyciag_brama', nazwa: 'Brama (podwójny wyciąg)', kat: 'Wyciągi' },
  { id: 'suwnica_nogi', nazwa: 'Suwnica na nogi (Leg press)', kat: 'Maszyny' },
  { id: 'maszyna_klatka_rozpietki', nazwa: 'Maszyna na klatkę (Pec deck)', kat: 'Maszyny' },
  { id: 'maszyna_plecy_wioslo', nazwa: 'Maszyna do wiosłowania siedząc', kat: 'Maszyny' },
  { id: 'maszyna_nogi_czworoglowe', nazwa: 'Maszyna wyprosty nóg (czwórki)', kat: 'Maszyny' },
  { id: 'maszyna_nogi_dwuglowe', nazwa: 'Maszyna ugięcia nóg (dwójki)', kat: 'Maszyny' },
  { id: 'maszyna_lydki', nazwa: 'Wspięcia na łydki (maszyna)', kat: 'Maszyny' },
  { id: 'uchwyt_sznur_triceps', nazwa: 'Uchwyt sznur / lina', kat: 'Akcesoria wyciągu' },
  { id: 'uchwyt_drazek_szeroki', nazwa: 'Drążek szeroki do wyciągu', kat: 'Akcesoria wyciągu' },
  { id: 'uchwyt_trojkat_wioslo', nazwa: 'Uchwyt trójkątny (wąski)', kat: 'Akcesoria wyciągu' },
  { id: 'gumy_oporowe_powerband', nazwa: 'Gumy oporowe (Powerband)', kat: 'Akcesoria' },
  { id: 'pas_obciazeniowy', nazwa: 'Pas pod obciążenie', kat: 'Akcesoria' },
  { id: 'rowerek_stacjonarny', nazwa: 'Rowerek stacjonarny', kat: 'Cardio' },
  { id: 'bieznia', nazwa: 'Bieżnia', kat: 'Cardio' },
  { id: 'ergometr_wioslarski', nazwa: 'Ergometr Wioślarski', kat: 'Cardio' },
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
  const [userId, setUserId] = useState<string | null>(null);
  
  // Własne pole preferencji (kreator swobodny dla AI)
  const [wlasnePreferencje, setWlasnePreferencje] = useState<string>(
    '118 kg, basen 2x w tyg po 40 min tempo 2:00, siłownia 2x FBW bez przeciążania stawów, spacery'
  );

  const [wygenerowanyPlan, setWygenerowanyPlan] = useState<any>(null);

  const [dane, setDane] = useState<ProfilUzytkownikaRozszerzony>({
    plec: 'mezczyzna',
    poziomAktywnosci: 'umiarkowana',
    celGlowny: 'redukcja_tluszczu',
    wiek: 23,
    wzrostCm: 180,
    wagaAktualnaKg: 118,
    wagaDocelowaKg: 95,
    pomiary: { 
      klatkaCm: 0, 
      pasTaliaCm: 0, 
      biodraCm: 0, 
      karkSzyjaCm: 0,
      bicepsCm: 0, 
      udoCm: 0,
      lydkaCm: 0,
      przedramieCm: 0
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
      sredniaObjetoscSesjiMetry: 1200,
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
    async function sprawdzSesje() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/logowanie');
        return;
      }
      setUserId(user.id);
      setZamontowano(true);

      const zapisaneAutosave = localStorage.getItem(`autosave_ankieta_${user.id}`);
      if (zapisaneAutosave) {
        try {
          const pobraneDane = JSON.parse(zapisaneAutosave);
          setDane(aktualne => ({
            ...aktualne,
            ...pobraneDane,
            harmonogram: pobraneDane.harmonogram || aktualne.harmonogram,
            pomiary: { ...aktualne.pomiary, ...(pobraneDane.pomiary || {}) },
            basen: { ...aktualne.basen, ...(pobraneDane.basen || {}) }
          }));
          if (pobraneDane.wlasnePreferencje) {
            setWlasnePreferencje(pobraneDane.wlasnePreferencje);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    sprawdzSesje();
  }, [router]);

  useEffect(() => {
    if (zamontowano && userId) {
      localStorage.setItem(`autosave_ankieta_${userId}`, JSON.stringify({ ...dane, wlasnePreferencje }));
    }
  }, [dane, wlasnePreferencje, zamontowano, userId]);

  if (!zamontowano) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 text-sm">Weryfikacja profilu...</div>;
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

  const generujPlan = async () => {
    setLadowanie(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/logowanie');
        return;
      }

      const dzisiejszaData = new Date().toISOString().split('T')[0];
      const zmapowanePomiary = [
        { id: Date.now() + 1, user_id: user.id, kategoria: 'Masa ciała', wartosc: dane.wagaAktualnaKg || 0, data: dzisiejszaData },
        { id: Date.now() + 2, user_id: user.id, kategoria: 'Klatka piersiowa', wartosc: dane.pomiary.klatkaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 3, user_id: user.id, kategoria: 'Talia', wartosc: dane.pomiary.pasTaliaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 4, user_id: user.id, kategoria: 'Biodra', wartosc: dane.pomiary.biodraCm || 0, data: dzisiejszaData },
        { id: Date.now() + 5, user_id: user.id, kategoria: 'Szyja/kark', wartosc: dane.pomiary.karkSzyjaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 6, user_id: user.id, kategoria: 'Ramię/biceps', wartosc: dane.pomiary.bicepsCm || 0, data: dzisiejszaData },
        { id: Date.now() + 7, user_id: user.id, kategoria: 'Udo', wartosc: dane.pomiary.udoCm || 0, data: dzisiejszaData },
        { id: Date.now() + 8, user_id: user.id, kategoria: 'Łydka', wartosc: dane.pomiary.lydkaCm || 0, data: dzisiejszaData }
      ].filter(p => p.wartosc > 0);

      if (zmapowanePomiary.length > 0) {
        await supabase.from('pomiary').insert(zmapowanePomiary);
      }

      // Dołączamy preferencje tekstowe do promptu API
      const payload = {
        ...dane,
        wlasnePreferencje,
        zdrowieIKontuzje: `${dane.zdrowieIKontuzje || ''} | Preferencje: ${wlasnePreferencje}`
      };

      const res = await fetch('/api/asystent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Nieznany błąd serwera');

      setWygenerowanyPlan(json);
      setKrok(6);

    } catch (err: any) {
      console.error('Błąd ankiety:', err);
      alert(`Błąd: ${err.message}`);
    } finally {
      setLadowanie(false);
    }
  };

  const zmienDzienWPlanie = (index: number, nowyDzien: string) => {
    const kopia = { ...wygenerowanyPlan };
    if (kopia.treningiTygodnia && kopia.treningiTygodnia[index]) {
      kopia.treningiTygodnia[index].dzienTygodnia = nowyDzien;
      setWygenerowanyPlan(kopia);
    }
  };

  const usunCwiczenieZPlanu = (dzienIdx: number, cwIdx: number) => {
    const kopia = { ...wygenerowanyPlan };
    kopia.treningiTygodnia[dzienIdx].cwiczeniaIZadania.splice(cwIdx, 1);
    setWygenerowanyPlan(kopia);
  };

  const zatwierdzIZapiszKoncowyPlan = async () => {
    setLadowanie(true);
    try {
      if (!userId || !wygenerowanyPlan) return;

      localStorage.removeItem(`autosave_ankieta_${userId}`);
      localStorage.setItem('wygenerowany_plan_ai', JSON.stringify(wygenerowanyPlan));

      await supabase.from('plany').upsert({
        user_id: userId,
        dane_planu: wygenerowanyPlan,
        zaktualizowano_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      router.push('/');
    } catch (err: any) {
      alert("Błąd zapisu planu: " + err.message);
    } finally {
      setLadowanie(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-28 w-full max-w-xl mx-auto flex flex-col justify-between overflow-x-hidden">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            {krok <= 5 ? `Krok ${krok} z 5` : 'Krok 6: Sprawdź i przestaw plan'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium text-right">
            {krok === 1 && 'Podstawy i Własne Wytyczne'}
            {krok === 2 && 'Pomiary ciała'}
            {krok === 3 && 'Zdrowie i Basen'}
            {krok === 4 && 'Inwentarz Siłowni'}
            {krok === 5 && 'Harmonogram Treningowy'}
            {krok === 6 && 'Dopasowanie dni i ćwiczeń'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-300 rounded-full" style={{ width: `${Math.min(100, (krok / 5) * 100)}%` }} />
        </div>

        {/* KROK 1 */}
        {krok === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Podstawy profilu</h1>

            {/* POLE PREFERENCJI DLA AI */}
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Twoje wytyczne dla trenera AI:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Wpisz tu dokładnie, jak chcesz trenować (np. ile razy basen, jakie tempo, styl FBW, spacery, ochrona stawów):
              </p>
              <textarea
                rows={3}
                value={wlasnePreferencje}
                onChange={(e) => setWlasnePreferencje(e.target.value)}
                placeholder="np. 118 kg, basen 2x w tyg po 40 min tempo 2:00, siłownia 2x FBW bez przeciążania stawów, spacery"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-400 leading-relaxed font-medium"
              />
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <label className="text-xs text-slate-400 block mb-2 font-medium">Płeć:</label>
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

        {/* KROK 2 */}
        {krok === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">Pomiary ciała (cm)</h1>
                <p className="text-xs text-slate-400">Możesz wpisać teraz lub pominąć i uzupełnić później.</p>
              </div>
              <button
                type="button"
                onClick={() => setKrok(3)}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 px-3 py-1.5 rounded-xl font-medium transition"
              >
                Pomiń ten krok →
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-1.5 mb-4 text-emerald-400 text-sm font-semibold">
                <Ruler className="w-4 h-4" />
                <span>Dokładne obwody</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400">Klatka piersiowa</label>
                  <input type="number" placeholder="opcjonalnie" value={dane.pomiary.klatkaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, klatkaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Pas / Talia (pępek)</label>
                  <input type="number" placeholder="opcjonalnie" value={dane.pomiary.pasTaliaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, pasTaliaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Biodra / Pośladki</label>
                  <input type="number" placeholder="opcjonalnie" value={dane.pomiary.biodraCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, biodraCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Ramię / Biceps</label>
                  <input type="number" placeholder="opcjonalnie" value={dane.pomiary.bicepsCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, bicepsCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Udo</label>
                  <input type="number" placeholder="opcjonalnie" value={dane.pomiary.udoCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, udoCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Łydka</label>
                  <input type="number" placeholder="opcjonalnie" value={dane.pomiary.lydkaCm || ''} onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, lydkaCm: Number(e.target.value) } })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KROK 3 */}
        {krok === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Zdrowie i Basen</h1>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <HeartPulse className="w-4 h-4" />
                <span>Urazy, przebyte kontuzje, wrażliwe stawy (Ochrona stawów)</span>
              </div>
              <textarea
                rows={3}
                placeholder="np. Duża waga, ochrona kolan i kręgosłupa, bez ciężkich przysiadów i skoków..."
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

        {/* KROK 4 */}
        {krok === 4 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Dostępny inwentarz</h1>
            <p className="text-xs text-slate-400">Zaznacz sprzęt na siłowni, aby AI dobrało ćwiczenia nieprzeciążające stawów.</p>

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
            </div>
          </div>
        )}

        {/* KROK 5 */}
        {krok === 5 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="text-emerald-400 w-6 h-6" /> Twój harmonogram
            </h1>
            <p className="text-xs text-slate-400 mb-4">
              Wybierz wstępne dni treningowe. Po wygenerowaniu będziesz mógł je jeszcze dowolnie przestawiać w Kroku 6.
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

        {/* KROK 6 */}
        {krok === 6 && wygenerowanyPlan && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-emerald-400">Dopasuj swój plan</h1>
              <p className="text-xs text-slate-400">Możesz zmienić dzień tygodnia dla dowolnego treningu przed zatwierdzeniem.</p>
            </div>

            {wygenerowanyPlan.makroskladniki && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-800/40 p-2 rounded-xl">
                  <p className="text-[9px] text-slate-400 uppercase">Kcal</p>
                  <p className="text-xs font-bold text-emerald-400">{wygenerowanyPlan.makroskladniki.kalorieKcal}</p>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-xl">
                  <p className="text-[9px] text-slate-400 uppercase">Białko</p>
                  <p className="text-xs font-bold text-indigo-400">{wygenerowanyPlan.makroskladniki.bialkoGramy}g</p>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-xl">
                  <p className="text-[9px] text-slate-400 uppercase">Tłuszcze</p>
                  <p className="text-xs font-bold text-rose-400">{wygenerowanyPlan.makroskladniki.tluszczeGramy}g</p>
                </div>
                <div className="bg-slate-800/40 p-2 rounded-xl">
                  <p className="text-[9px] text-slate-400 uppercase">Węgle</p>
                  <p className="text-xs font-bold text-amber-400">{wygenerowanyPlan.makroskladniki.weglowodanyGramy}g</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {wygenerowanyPlan.treningiTygodnia?.map((dzien: any, dIdx: number) => (
                <div key={dIdx} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Dzień:</span>
                      <select
                        value={dzien.dzienTygodnia}
                        onChange={(e) => zmienDzienWPlanie(dIdx, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-bold"
                      >
                        {DNI_TYGODNIA.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {dzien.typ}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-xs text-white">{dzien.tytul}</h3>
                    <p className="text-[10px] text-slate-400">{dzien.akcent}</p>
                  </div>

                  <div className="space-y-1.5">
                    {dzien.cwiczeniaIZadania?.map((cw: any, cwIdx: number) => (
                      <div key={cwIdx} className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <span className="text-slate-200 font-medium">{cw.nazwa}</span>
                          <span className="text-[10px] text-slate-400 ml-2">({cw.opisSerii})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => usunCwiczenieZPlanu(dIdx, cwIdx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                          title="Usuń ćwiczenie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Nawigacja Dolna */}
      <div className="flex items-center gap-3 pt-6">
        {krok > 1 && krok <= 5 && (
          <button
            type="button"
            disabled={ladowanie}
            onClick={() => setKrok(krok - 1)}
            className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {krok < 5 && (
          <button
            type="button"
            onClick={() => setKrok(krok + 1)}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-slate-950 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <span>Dalej</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}

        {krok === 5 && (
          <button
            type="button"
            disabled={ladowanie}
            onClick={generujPlan}
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

        {krok === 6 && (
          <div className="flex gap-2 w-full">
            <button
              type="button"
              disabled={ladowanie}
              onClick={() => setKrok(5)}
              className="w-1/3 bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold py-3.5 px-3 rounded-2xl text-xs transition"
            >
              ← Popraw ankietę
            </button>
            <button
              type="button"
              disabled={ladowanie}
              onClick={zatwierdzIZapiszKoncowyPlan}
              className="w-2/3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              {ladowanie ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Zapisuję...</span>
                </>
              ) : (
                <>
                  <span>Zatwierdź i idź do Pulpitu</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}