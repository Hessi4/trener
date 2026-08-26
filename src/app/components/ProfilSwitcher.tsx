'use client';
import { useEffect, useState } from 'react';
import { getActiveUserId, setActiveUserId } from '@/app/lib/user';

export default function ProfilSwitcher() {
  const [profil, setProfil] = useState<string>('Tata');

  useEffect(() => {
    setProfil(getActiveUserId());
  }, []);

  const zmienProfil = (nowy: string) => {
    setActiveUserId(nowy);
    setProfil(nowy);
    window.location.reload(); // Przeładowuje dane dla wybranego użytkownika
  };

  return (
    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-sm mb-4">
      <span className="text-neutral-400 pl-1">Profil:</span>
      {['Tata', 'Mateusz'].map((uzytkownik) => (
        <button
          key={uzytkownik}
          onClick={() => zmienProfil(uzytkownik)}
          className={`px-3 py-1 rounded-lg font-medium transition ${
            profil === uzytkownik
              ? 'bg-blue-600 text-white shadow'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          {uzytkownik}
        </button>
      ))}
    </div>
  );
}