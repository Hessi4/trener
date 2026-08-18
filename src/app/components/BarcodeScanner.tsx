// src/components/BarcodeScanner.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError?: (error: string) => void;
}

export default function BarcodeScanner({ onScanSuccess, onScanError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [błąd, setBłąd] = useState<string | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let isMounted = true;

    codeReader.listVideoInputDevices()
      .then((videoInputDevices) => {
        if (videoInputDevices.length === 0) {
          throw new Error("Nie znaleziono żadnej kamery w urządzeniu.");
        }
        // Wybieramy domyślną kamerę (zazwyczaj tylną w telefonie lub przednią w laptopie)
        const selectedDeviceId = videoInputDevices[0].deviceId;

        if (videoRef.current && isMounted) {
          codeReader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result && isMounted) {
                onScanSuccess(result.getText());
                // Zatrzymujemy czytnik po udanym zeskanowaniu
                codeReader.reset();
              }
              if (err && !(err.name === 'NotFoundException')) {
                // Ignorujemy zwykłe błędy typu "brak kodu w kadrze"
                console.debug(err);
              }
            }
          );
        }
      })
      .catch((err) => {
        if (isMounted) {
          setBłąd(err.message || "Błąd dostępu do kamery.");
          if (onScanError) onScanError(err.message);
        }
      });

    return () => {
      isMounted = false;
      codeReader.reset();
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-black/90 rounded-xl overflow-hidden shadow-lg">
      {błąd ? (
        <div className="text-red-400 text-center p-4">
          <p className="font-bold">Problem z kamerą:</p>
          <p className="text-sm">{błąd}</p>
        </div>
      ) : (
        <div className="relative w-full max-w-md aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 m-12 pointer-events-none rounded-lg flex items-center justify-center">
            <span className="text-white/70 text-xs bg-black/60 px-2 py-1 rounded">Skieruj kod w to miejsce</span>
          </div>
        </div>
      )}
    </div>
  );
}