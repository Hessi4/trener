// src/lib/auth.ts
export const getStorageKey = (key: string) => {
  if (typeof window === 'undefined') return key;
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return key;
  const { user } = JSON.parse(currentUser);
  return `${key}_${user}`;
};