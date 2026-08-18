// src/app/ankieta-startowa/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ProfilUzytkownikaRozszerzony, 
  CelGlowny, 
  SprzetGarazowy, 
  StylPlywacki, 
  AkcesoriaPlywackie,
  PoziomPlywania 
} from '@/app/typy/uzytkownik';
import { 
  Flame, Activity, Trophy, HeartPulse, 
  ArrowRight, ArrowLeft, CheckCircle2, Ruler, Loader2 
} from 'lucide-react';

const CELE: { id: CelGlowny; tytul: string; opis: string; ikona: any }[] = [
  { id: 'redukcja_tluszczu', tytul: 'Redukcja i Rzeźba', opis: 'Spalanie tkanki tłuszczowej, ochrona mięśni i ujemny bilans kaloryczny.', ikona: Flame },
  { id: 'rekompozycja_forma', tytul: 'Rekompozycja Sylwetki', opis: 'Budowa siły z równoległym spadkiem obwodów.', ikona: Activity },
  { id: 'poprawa_wydolnosci', tytul: 'Wydolność Hybrydowa', opis: 'Maksimum tlenowe i tempo w wodzie.', ikona: Trophy },
];

const SPRZET_SILOWNIA: { id: SprzetGarazowy; nazwa: string; kat: string }[] = [
  { id: 'hantle_regulowane', nazwa: 'Hantle regulowane', kat: 'Wolne ciężary' },
  { id: 'gryf_prosty_olimpijski', nazwa: 'Gryf olimpijski (50mm)', kat: 'Wolne ciężary' },
  { id: 'gryf_prosty_zwykly', nazwa: 'Gryf prosty (28/30mm)', kat: 'Wolne ciężary' },
  { id: 'gryf_lamany', nazwa: 'Gryf łamany (biceps/triceps)', kat: 'Wolne ciężary' },
  { id: 'lawka_regulowana_katy', nazwa: 'Ławka regulowana (kąt dodatni/poziom)', kat: 'Stanowiska' },
  { id: 'stojaki_do_przysiadow', nazwa: 'Stojaki pod sztangę / klatka', kat: 'Stanowiska' },
  { id: 'drazek_do_podciagania', nazwa: 'Drążek do podciągania', kat: 'Masa ciała' },
  { id: 'porecze_dipsy', nazwa: 'Poręcze stacjonarne do dipsów', kat: 'Masa ciała' },
  { id: 'wyciag_gorny', nazwa: 'Wyciąg górny (lat pulldown)', kat: 'Wyciągi' },
  { id: 'wyciag_dolny', nazwa: 'Wyciąg dolny (wiosłowanie)', kat: 'Wyciągi' },
  { id: 'uchwyt_sznur_triceps', nazwa: 'Uchwyt sznur / lina (triceps/barki)', kat: 'Akcesoria wyciągu' },
  { id: 'uchwyt_drazek_szeroki', nazwa: 'Drążek szeroki do wyciągu', kat: 'Akcesoria wyciągu' },
  { id: 'uchwyt_trojkat_wioslo', nazwa: 'Uchwyt trójkątny (wąski chwyt)', kat: 'Akcesoria wyciągu' },
  { id: 'gumy_oporowe_powerband', nazwa: 'Gumy oporowe (Powerband)', kat: 'Akcesoria' },
  { id: 'pas_obciazeniowy', nazwa: 'Pas z łańcuchem pod obciążenie', kat: 'Akcesoria' },
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

export default function AnkietaStartowa() {
  const router = useRouter();
  const [krok, setKrok] = useState<number>(1);
  const [ladowanie, setLadowanie] = useState<boolean>(false);

  const [dane, setDane] = useState<ProfilUzytkownikaRozszerzony>(() => {
    if (typeof window !== 'undefined') {
      const zapisaneAutosave = localStorage.getItem('autosave_ankieta');
      if (zapisaneAutosave) {
        try {
          return JSON.parse(zapisaneAutosave);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
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
        bicepsPrawyCm: 38, 
        bicepsLewyCm: 37.5,
        udoPraweCm: 60,
        udoLeweCm: 60,
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
        'uchwyt_sznur_triceps'
      ],
      szczegolySilowni: { maksObciazenieGryfKg: 90, maksHantleKg: 24, skosUjemnyLawka: false },
      basen: {
        poziom: 'sredniozaawansowany',
        znaneStyle: ['kraul', 'grzbiet'],
        akcesoria: ['deska', 'ósemka_pullbuoy', 'stoper_zegarek'],
        czasNajszybsze50mKraul: '0:34',
        tempo100mKraulKomfort: '1:45',
        czasNa400mKraul: '7:30',
        sredniaObjetoscSesjiMetry: 1500,
        maksDystansCiaglyMetry: 2000,
        dlugoscBasenuMetry: 25,
        umiejetnoscNawrotuKozilkowego: false,
        skupienie: 'tempo_interwaly',
      },
    };
  });

  // Autosave do localStorage przy każdej zmianie danych
  useEffect(() => {
    localStorage.setItem('autosave_ankieta', JSON.stringify(dane));
  }, [dane]);

  const przelaczElement = <T,>(lista: T[], element: T): T[] => {
    return lista.includes(element) ? lista.filter((i) => i !== element) : [...lista, element];
  };

  const zakonczAnkiete = async () => {
    setLadowanie(true);
    try {
      localStorage.setItem('profil_uzytkownika', JSON.stringify(dane));

      // 1. Zapis danych z ankiety jako pomiary do zakładki "Pomiary ciała"
      const dzisiejszaData = new Date().toISOString().split('T')[0];
      const zmapowanePomiary = [
        { id: Date.now() + 1, kategoria: 'Masa ciała', wartosc: dane.wagaAktualnaKg || 0, data: dzisiejszaData },
        { id: Date.now() + 2, kategoria: 'Klatka piersiowa', wartosc: dane.pomiary.klatkaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 3, kategoria: 'Talia', wartosc: dane.pomiary.pasTaliaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 4, kategoria: 'Biodra', wartosc: dane.pomiary.biodraCm || 0, data: dzisiejszaData },
        { id: Date.now() + 5, kategoria: 'Szyja/kark', wartosc: dane.pomiary.karkSzyjaCm || 0, data: dzisiejszaData },
        { id: Date.now() + 6, kategoria: 'Ramię/biceps', wartosc: Math.max(dane.pomiary.bicepsPrawyCm || 0, dane.pomiary.bicepsLewyCm || 0), data: dzisiejszaData },
        { id: Date.now() + 7, kategoria: 'Udo', wartosc: Math.max(dane.pomiary.udoPraweCm || 0, dane.pomiary.udoLeweCm || 0), data: dzisiejszaData },
        { id: Date.now() + 8, kategoria: 'Łydka', wartosc: dane.pomiary.lydkaCm || 0, data: dzisiejszaData }
      ].filter(p => p.wartosc > 0); // Teraz TypeScript wie, że wartosc to na pewno liczba

      const istniejacePomiary = JSON.parse(localStorage.getItem('historia_pomiarow_szczegolowa') || '[]');
      // Filtrujemy startowe (fejkowe) pomiary z poprzednich miesięcy
      const bezWypelniaczy = istniejacePomiary.filter((p: any) => p.data !== '2026-05-01' && p.data !== '2026-06-01' && p.data !== '2026-07-01');
      
      const zaktualizowanePomiary = [...bezWypelniaczy, ...zmapowanePomiary];
      localStorage.setItem('historia_pomiarow_szczegolowa', JSON.stringify(zaktualizowanePomiary));

      // 2. Wysłanie danych do API, aby wygenerować plan AI
      const res = await fetch('/api/asystent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dane),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Nieznany błąd serwera');
      }

      localStorage.setItem('wygenerowany_plan_ai', JSON.stringify(json));
      
      // 3. Czyszczenie autosave po udanym generowaniu
      localStorage.removeItem('autosave_ankieta');

      // 4. Przekierowanie na stronę główną
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
        {/* Pasek postępu */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Krok {krok} z 4
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {krok === 1 && 'Cel & Pomiary Ciała'}
            {krok === 2 && 'Zdrowie & Biomechanika'}
            {krok === 3 && 'Parametry Basenu'}
            {krok === 4 && 'Inwentarz Siłowni'}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
          <div className="bg-emerald-500 h-full transition-all duration-300 rounded-full" style={{ width: `${(krok / 4) * 100}%` }} />
        </div>

        {/* KROK 1: CEL I PEŁNE OBWODY */}
        {krok === 1 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Cel i dokładne obwody ciała</h1>
            <div className="space-y-2">
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

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400">Waga obecna (kg)</label>
                  <input
                    type="number"
                    value={dane.wagaAktualnaKg}
                    onChange={(e) => setDane({ ...dane, wagaAktualnaKg: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Waga cel (kg)</label>
                  <input
                    type="number"
                    value={dane.wagaDocelowaKg}
                    onChange={(e) => setDane({ ...dane, wagaDocelowaKg: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Wiek (lata)</label>
                  <input
                    type="number"
                    value={dane.wiek}
                    onChange={(e) => setDane({ ...dane, wiek: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400">Wzrost (cm)</label>
                  <input
                    type="number"
                    value={dane.wzrostCm}
                    onChange={(e) => setDane({ ...dane, wzrostCm: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs mt-1"
                  />
                </div>
              </div>

              {/* Pełne obwody ciała */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 mb-2.5 text-emerald-400 text-xs font-semibold">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>Wszystkie obwody ciała (cm):</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Klatka piersiowa</label>
                    <input
                      type="number"
                      placeholder="np. 104"
                      value={dane.pomiary.klatkaCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, klatkaCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Pas / Talia (pępek)</label>
                    <input
                      type="number"
                      placeholder="np. 88"
                      value={dane.pomiary.pasTaliaCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, pasTaliaCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Biodra / Pośladki</label>
                    <input
                      type="number"
                      placeholder="np. 98"
                      value={dane.pomiary.biodraCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, biodraCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Kark / Szyja</label>
                    <input
                      type="number"
                      placeholder="np. 39"
                      value={dane.pomiary.karkSzyjaCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, karkSzyjaCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Biceps Prawy (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 38"
                      value={dane.pomiary.bicepsPrawyCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, bicepsPrawyCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Biceps Lewy (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 37.5"
                      value={dane.pomiary.bicepsLewyCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, bicepsLewyCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Udo Prawe (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 60"
                      value={dane.pomiary.udoPraweCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, udoPraweCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Udo Lewe (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 60"
                      value={dane.pomiary.udoLeweCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, udoLeweCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Łydka (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 38"
                      value={dane.pomiary.lydkaCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, lydkaCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Przedramię (cm)</label>
                    <input
                      type="number"
                      placeholder="np. 30"
                      value={dane.pomiary.przedramieCm || ''}
                      onChange={(e) => setDane({ ...dane, pomiary: { ...dane.pomiary, przedramieCm: Number(e.target.value) } })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KROK 2: ZDROWIE I KONTUZJE */}
        {krok === 2 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Zdrowie i biomechanika</h1>
            <p className="text-xs text-slate-400">
              AI wykluczy ćwiczenia powodujące nacisk na wrażliwe stawy (np. barki po basenie, odcinek lędźwiowy).
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <HeartPulse className="w-4 h-4" />
                <span>Urazy, przebyte kontuzje, wrażliwe stawy</span>
              </div>
              <textarea
                rows={4}
                placeholder="np. wrażliwe lędźwie przy ciężkim martwym ciągu, lekki ból przedniego aktonu barku przy wyciskaniu żołnierskim..."
                value={dane.zdrowieIKontuzje}
                onChange={(e) => setDane({ ...dane, zdrowieIKontuzje: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
        )}

        {/* KROK 3: PARAMETRY BASENU */}
        {krok === 3 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Trening pływacki i wydolność</h1>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">Poziom zaawansowania w wodzie:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['poczatkujacy', 'sredniozaawansowany', 'zaawansowany', 'zawodnik_masters'] as PoziomPlywania[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDane({ ...dane, basen: { ...dane.basen, poziom: p } })}
                      className={`p-2 rounded-xl border text-[11px] font-medium transition-all ${
                        dane.basen.poziom === p ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                      }`}
                    >
                      {p === 'poczatkujacy' && 'Początkujący (nauka)'}
                      {p === 'sredniozaawansowany' && 'Średni (płynny kraul)'}
                      {p === 'zaawansowany' && 'Zaawansowany'}
                      {p === 'zawodnik_masters' && 'Masters / Triatlon'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 mb-1.5 block">Opanowane style:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {STYLE_BASEN.map((styl) => {
                    const zaznaczony = dane.basen.znaneStyle.includes(styl.id);
                    return (
                      <button
                        key={styl.id}
                        type="button"
                        onClick={() => setDane({ ...dane, basen: { ...dane.basen, znaneStyle: przelaczElement(dane.basen.znaneStyle, styl.id) } })}
                        className={`p-2 rounded-xl border text-[11px] text-left transition-all ${
                          zaznaczony ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-medium' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                        }`}
                      >
                        {styl.nazwa} {zaznaczony && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="text-[11px] text-slate-400 mb-1.5 block">Akcesoria, które zabierasz na basen:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AKCESORIA_BASEN.map((akc) => {
                    const zaznaczony = dane.basen.akcesoria.includes(akc.id);
                    return (
                      <button
                        key={akc.id}
                        type="button"
                        onClick={() => setDane({ ...dane, basen: { ...dane.basen, akcesoria: przelaczElement(dane.basen.akcesoria, akc.id) } })}
                        className={`p-1.5 rounded-xl border text-[10px] text-left transition-all ${
                          zaznaczony ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                        }`}
                      >
                        {akc.nazwa} {zaznaczony && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400">Tempo komfort (100m kraul)</label>
                  <input
                    type="text"
                    value={dane.basen.tempo100mKraulKomfort}
                    onChange={(e) => setDane({ ...dane, basen: { ...dane.basen, tempo100mKraulKomfort: e.target.value } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Średnia objętość sesji (m)</label>
                  <input
                    type="number"
                    value={dane.basen.sredniaObjetoscSesjiMetry}
                    onChange={(e) => setDane({ ...dane, basen: { ...dane.basen, sredniaObjetoscSesjiMetry: Number(e.target.value) } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Najszybsze 50m (np. 0:34)</label>
                  <input
                    type="text"
                    value={dane.basen.czasNajszybsze50mKraul || ''}
                    onChange={(e) => setDane({ ...dane, basen: { ...dane.basen, czasNajszybsze50mKraul: e.target.value } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Długość toru</label>
                  <select
                    value={dane.basen.dlugoscBasenuMetry}
                    onChange={(e) => setDane({ ...dane, basen: { ...dane.basen, dlugoscBasenuMetry: Number(e.target.value) as 25 | 50 } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white mt-1"
                  >
                    <option value={25}>25 metrów (krótki)</option>
                    <option value={50}>50 metrów (olimpijski)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KROK 4: SIŁOWNIA W GARAŻU */}
        {krok === 4 && (
          <div className="space-y-4">
            <h1 className="text-xl font-bold">Inwentarz garażowej siłowni</h1>
            <p className="text-xs text-slate-400">
              Zaznacz dokładnie sprzęt i uchwyty. AI rozpisze serie wyłącznie na te przyrządy.
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto pr-1">
                {SPRZET_SILOWNIA.map((sprzet) => {
                  const zaznaczony = dane.sprzet.includes(sprzet.id);
                  return (
                    <button
                      key={sprzet.id}
                      type="button"
                      onClick={() => setDane({ ...dane, sprzet: przelaczElement(dane.sprzet, sprzet.id) })}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        zaznaczony ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-800/40 border-slate-700 text-slate-400'
                      }`}
                    >
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
                  <label className="text-[10px] text-slate-400">Maks. waga hantli (kg)</label>
                  <input
                    type="number"
                    value={dane.szczegolySilowni.maksHantleKg || ''}
                    onChange={(e) => setDane({ ...dane, szczegolySilowni: { ...dane.szczegolySilowni, maksHantleKg: Number(e.target.value) } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Maks. talerze na gryf (kg)</label>
                  <input
                    type="number"
                    value={dane.szczegolySilowni.maksObciazenieGryfKg || ''}
                    onChange={(e) => setDane({ ...dane, szczegolySilowni: { ...dane.szczegolySilowni, maksObciazenieGryfKg: Number(e.target.value) } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white mt-1"
                  />
                </div>
              </div>
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
        {krok < 4 ? (
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
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span className="text-slate-300">Generowanie planu przez AI...</span>
              </>
            ) : (
              <>
                <span>Zatwierdź profil i generuj plan AI</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </main>
  );
}