import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { IScannerControls } from '@zxing/browser';

interface ScannerSheetProps {
  open: boolean;
  onClose: () => void;
  /** Se llama con cada código detectado (deduplicado en el tiempo). */
  onDetected: (barcode: string) => void;
}

const DEDUPE_MS = 2500;

/** Pantalla de escaneo a cámara completa (cámara trasera). */
export function ScannerSheet({ open, onClose, onDetected }: ScannerSheetProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastRef = useRef<{ code: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let controls: IScannerControls | null = null;
    let cancelled = false;

    void (async () => {
      setError(null);
      try {
        const { startBarcodeScanner } = await import('./zxing-loader');
        if (cancelled || !videoRef.current) return;
        controls = await startBarcodeScanner(videoRef.current, (code) => {
          const now = Date.now();
          // Evita disparar varias veces el mismo código seguido.
          if (lastRef.current?.code === code && now - lastRef.current.at < DEDUPE_MS) return;
          lastRef.current = { code, at: now };
          navigator.vibrate?.(60);
          onDetected(code);
        });
      } catch {
        setError('No se pudo acceder a la cámara. Revisa los permisos.');
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [open, onDetected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 pt-[env(safe-area-inset-top)] text-white">
        <span className="font-medium">Escanear código</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar escáner"
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
        {/* Guía visual de encuadre */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-40 w-72 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
        <p className="absolute inset-x-0 bottom-10 px-6 text-center text-sm text-white/90">
          {error ?? 'Acerca el código de barras a la cámara con buena luz'}
        </p>
      </div>
    </div>
  );
}
