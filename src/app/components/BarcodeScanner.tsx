// src/components/BarcodeScanner.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, ChecksumException, FormatException } from '@zxing/library';

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

        const tylnaKamera = videoInputDevices.find((device) => {
          const label = device.label.toLowerCase();
          return (
            label.includes('back') ||
            label.includes('rear') ||
            label.includes('environment') ||
            label.includes('tył') ||
            label.includes('tylna')
          );
        });

        const selectedDeviceId = tylnaKamera 
          ? tylnaKamera.deviceId 
          : videoInputDevices[videoInputDevices.length - 1].deviceId;

        if (videoRef.current && isMounted) {
          codeReader.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current,
            (result, err) => {
              if (result && isMounted) {
                onScanSuccess(result.getText());
                codeReader.reset();
              }
              
              // Całkowite wyciszenie powtarzających się wyjątków skanowania klatek
              if (err) {
                if (
                  err instanceof NotFoundException ||
                  err instanceof ChecksumException ||
                  err instanceof FormatException ||
                  err.name === 'NotFoundException' ||
                  err.name === 'ChecksumException' ||
                  err.name === 'FormatException'
                ) {
                  return; // Ignoruj klatki bez kodu kreskowego
                }
              }
            }
          );
        }
      })
      .catch((err) => {
        if (isMounted) {
          // Ignoruj błąd jednoczesnego odtwarzania strumienia
          if (err.name === 'AbortError' || err.message?.includes('already playing')) return;
          
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
            playsInline
            muted
          />
          <div className="absolute inset-0 border-2 border-dashed border-emerald-500/50 m-12 pointer-events-none rounded-lg flex items-center justify-center">
            <span className="text-white/70 text-xs bg-black/60 px-2 py-1 rounded">Skieruj kod w to miejsce</span>
          </div>
        </div>
      )}
    </div>
  );
}