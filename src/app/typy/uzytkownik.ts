// src/typy/uzytkownik.ts

export type CelGlowny = 
  | 'redukcja_tluszczu'
  | 'rekompozycja_forma'
  | 'poprawa_wydolnosci';

export type PoziomPlywania = 'poczatkujacy' | 'sredniozaawansowany' | 'zaawansowany' | 'zawodnik_masters';
export type StylPlywacki = 'kraul' | 'grzbiet' | 'klasyczny' | 'motylkowy';

export type SprzetGarazowy = 
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
  | 'pas_obciazeniowy';

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
  bicepsPrawyCm?: number;
  bicepsLewyCm?: number;
  udoPraweCm?: number;
  udoLeweCm?: number;
  lydkaCm?: number;
  przedramieCm?: number;
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

export interface ProfilUzytkownikaRozszerzony {
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
  typ: 'Basen' | 'Siłownia' | 'Regeneracja';
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