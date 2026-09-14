// src/app/components/LogoNexus.tsx
import React from 'react';

interface LogoNexusProps {
  size?: number;
  className?: string;
}

export default function LogoNexus({ size = 48, className = "" }: LogoNexusProps) {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-2xl bg-zinc-950 p-1 shadow-lg shadow-emerald-500/15 border border-zinc-800/80 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Główny gradient NEXUS: Szmaragd -> Cyjan -> Indygo */}
          <linearGradient id="nexusGrad" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="0.6" stopColor="#06B6D4" />
            <stop offset="1" stopColor="#6366F1" />
          </linearGradient>

          {/* Subtelny blask tarczy */}
          <radialGradient id="nexusGlow" cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" stopOpacity="0.15" />
            <stop offset="1" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Tarcza kafelka */}
        <rect width="100" height="100" rx="22" fill="#09090b" />
        <rect width="100" height="100" rx="22" fill="url(#nexusGlow)" />
        <rect x="1.5" y="1.5" width="97" height="97" rx="20.5" stroke="#27272a" strokeWidth="1.5" />

        {/* Litera N - lewy pionowy filar */}
        <path
          d="M26 72V28"
          stroke="url(#nexusGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
        />

        {/* Litera N - skośna dynamiczna belka energii/węzła */}
        <path
          d="M27 30L73 70"
          stroke="url(#nexusGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
        />

        {/* Litera N - prawy pionowy filar */}
        <path
          d="M74 72V28"
          stroke="url(#nexusGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
        />

        {/* Węzeł rdzenia AI (połączenie w centrum litery N) */}
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="8" stroke="#06B6D4" strokeWidth="2.5" strokeOpacity="0.8" />
      </svg>

      {/* Dioda statusu online */}
      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-zinc-950 rounded-full animate-pulse" />
    </div>
  );
}