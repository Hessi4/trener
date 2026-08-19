// src/typy/uzytkownik.ts

export type Plec = 'mezczyzna' | 'kobieta';

export type PoziomAktywnosci = 
  | 'siedzaca' // Np. praca za biurkiem, brak ruchu
  | 'lekka' // 1-2 lekkie treningi, dużo siedzenia
  | 'umiarkowana' // 3-4 treningi, praca mieszana
  | 'wysoka' // 5+ treningów lub praca mocno fizyczna
  | 'bardzo_wysoka'; // Zawodowi sportowcy, ciężka praca fizyczna

export type CelGlowny = 
  | 'redukcja_tluszczu'
  | 'rekompozycja_forma'
  | 'poprawa_wydolnosci';

export type PoziomPlywania = 'poczatkujacy' | 'sredniozaawansowany' | 'zaawansowany' | 'zawodnik_masters';
export type StylPlywacki = 'kraul' | 'grzbiet' | 'klasyczny' | 'motylkowy';

export type SprzetGarazowy = 
  // Stara podstawa
  | 'hantle_regulowane'
  | 'gryf_prosty_olimpijski'
  | 'gryf_prosty_zwykly'
  | 'gryf_lamany'
  | 'lawka_regulowana_katy'
  | 'wyciag_gorny'
  | 'wyciag_dolny'
  | 'drazek_do_podciagania'
  | 'porecze_dipsy'
  | 'stojaki_do_przysiadow'
  | 'uchwyt_sznur_triceps'
  | 'uchwyt_drazek_szeroki'
  | 'uchwyt_trojkat_wioslo'
  | 'gumy_oporowe_powerband'
  | 'pas_obciazeniowy'
  // Nowy sprzęt z komercyjnych siłowni i wolne ciężary
  | 'maszyna_smitha'
  | 'suwnica_nogi'
  | 'wyciag_brama'
  | 'kettlebells'
  | 'maszyna_klatka_rozpietki'
  | 'maszyna_plecy_wioslo'
  | 'maszyna_nogi_czworoglowe'
  | 'maszyna_nogi_dwuglowe'
  | 'maszyna_lydki'
  | 'rowerek_stacjonarny'
  | 'bieznia'
  | 'ergometr_wioslarski';

export type AkcesoriaPlywackie = 
  | 'deska'
  | 'ósemka_pullbuoy'
  | 'pletwy_krotkie'
  | 'lapki_duze'
  | 'lapki_male_techniczne'
  | 'rurka_czolowa'
  | 'stoper_zegarek';

export interface PomiaryCiala {
  klatkaCm?: number;
  pasTaliaCm?: number;
  biodraCm?: number;
  karkSzyjaCm?: number;
  
  // Zmienione na pojedyncze wymiary
  bicepsCm?: number;
  udoCm?: number;
  lydkaCm?: number;
  przedramieCm?: number;

  // Zostawione stare nazwy dla kompatybilności wstecznej (żeby stara apka nie wyrzuciła błędu)
  bicepsPrawyCm?: number;
  bicepsLewyCm?: number;
  udoPraweCm?: number;
  udoLeweCm?: number;
}

export interface SzczegolySilowni {
  maksObciazenieGryfKg?: number;
  maksHantleKg?: number;
  skosUjemnyLawka?: boolean;
}

export interface SzczegolyBasenuRozszerzone {
  poziom: PoziomPlywania;
  znaneStyle: StylPlywacki[];
  akcesoria: AkcesoriaPlywackie[];
  czasNajszybsze50mKraul?: string;
  tempo100mKraulKomfort: string;
  czasNa400mKraul?: string;
  sredniaObjetoscSesjiMetry: number;
  maksDystansCiaglyMetry: number;
  dlugoscBasenuMetry: 25 | 50;
  umiejetnoscNawrotuKozilkowego: boolean;
  skupienie: 'technika_pozycja' | 'tempo_interwaly' | 'wytrzymalosc_tlenowa';
}

export interface DzienHarmonogramu {
  dzienTygodnia: 'Poniedziałek' | 'Wtorek' | 'Środa' | 'Czwartek' | 'Piątek' | 'Sobota' | 'Niedziela';
  rodzajTreningu: 'Siłownia' | 'Basen' | 'Cardio' | 'Wolne';
}

export interface ProfilUzytkownikaRozszerzony {
  // NOWE POLA
  plec: Plec;
  poziomAktywnosci: PoziomAktywnosci;
  harmonogram: DzienHarmonogramu[];
  
  // STARE POLA
  celGlowny: CelGlowny;
  wiek: number;
  wzrostCm: number;
  wagaAktualnaKg: number;
  wagaDocelowaKg: number;
  pomiary: PomiaryCiala;
  zdrowieIKontuzje: string;
  sprzet: SprzetGarazowy[];
  szczegolySilowni: SzczegolySilowni;
  basen: SzczegolyBasenuRozszerzone;
}

// Typy pod wygenerowany plan z AI
export interface ZadanieTreningowe {
  nazwa: string;
  opisSerii: string;
  uwagiTechniczne: string;
}

export interface DzienTreningowy {
  dzienTygodnia: 'Poniedziałek' | 'Wtorek' | 'Środa' | 'Czwartek' | 'Piątek' | 'Sobota' | 'Niedziela';
  typ: 'Basen' | 'Siłownia' | 'Cardio' | 'Regeneracja';
  tytul: string;
  akcent: string;
  cwiczeniaIZadania: ZadanieTreningowe[];
}

export interface PlanTygodniowyAI {
  makroskladniki: {
    kalorieKcal: number;
    bialkoGramy: number;
    weglowodanyGramy: number;
    tluszczeGramy: number;
    uzasadnienie: string;
  };
  treningiTygodnia: DzienTreningowy[];
}