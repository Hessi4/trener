export const getActiveUserId = (): string => {
  if (typeof window === 'undefined') return 'domyslny_uzytkownik';
  return localStorage.getItem('trener_aktywny_profil') || 'Tata';
};

export const setActiveUserId = (userId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('trener_aktywny_profil', userId);
  }
};