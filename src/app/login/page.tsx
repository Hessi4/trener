// src/app/login/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) return;

    // Proste "logowanie" - zapisujemy usera w localStorage
    localStorage.setItem('currentUser', JSON.stringify({ user, pass }));
    
    // Sprawdzamy czy ma już plan (ankieta była)
    const maPlan = localStorage.getItem(`plan_${user}`);
    
    if (!maPlan) {
      router.push('/ankieta-startowa');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 pt-20 text-white min-h-screen bg-zinc-950 space-y-6">
      <h1 className="text-3xl font-black text-emerald-400">Witaj w FitApp</h1>
      <form onSubmit={handleLogin} className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
        <input type="text" placeholder="Imię / Profil" className="w-full bg-zinc-800 p-3 rounded-lg" value={user} onChange={(e) => setUser(e.target.value)} required />
        <input type="password" placeholder="Hasło" className="w-full bg-zinc-800 p-3 rounded-lg" value={pass} onChange={(e) => setPass(e.target.value)} required />
        <button type="submit" className="w-full bg-emerald-600 py-3 rounded-lg font-bold">Zaloguj / Stwórz profil</button>
      </form>
    </div>
  );
}