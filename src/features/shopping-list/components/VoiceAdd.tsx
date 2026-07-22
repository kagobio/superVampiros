import { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { applyReceiptItems, type ReceiptItem } from '@/services/receipt/receipt.service';
import { parseVoiceText } from '@/services/voice/voice.service';
import { toast } from '@/stores/toast.store';
import { Button } from '@/components/ui/Button';
import { useCategories } from '@/hooks/useTaxonomies';
import { useProducts } from '@/features/inventory/hooks/useProducts';
import { ItemsReviewSheet } from './ItemsReviewSheet';

/** Tipos mínimos del reconocimiento de voz (no están en las libs estándar). */
interface SpeechResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Phase = 'idle' | 'parsing' | 'review';

/**
 * Añadir productos dictando: el móvil transcribe (Web Speech API), la IA lo
 * convierte en productos con cantidad y el usuario revisa antes de añadirlos.
 */
export function VoiceAdd() {
  const products = useProducts();
  const categories = useCategories();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef('');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const finish = async (text: string) => {
    if (!text.trim()) return;
    setError(null);
    setItems([]);
    setPhase('parsing');
    try {
      setItems(await parseVoiceText(text));
      setPhase('review');
    } catch (err) {
      setPhase('review');
      setError(err instanceof Error ? err.message : 'No se pudo interpretar lo que has dicho.');
    }
  };

  const start = () => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast('Este navegador no permite dictar. Prueba en Chrome.', 'default');
      return;
    }
    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = true;
    transcriptRef.current = '';
    setTranscript('');

    recognition.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i]?.[0]?.transcript ?? '';
      }
      transcriptRef.current = text;
      setTranscript(text);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      void finish(transcriptRef.current);
    };

    setListening(true);
    recognition.start();
  };

  const stop = () => recognitionRef.current?.stop();

  const close = () => {
    setPhase('idle');
    setItems([]);
    setError(null);
    setTranscript('');
  };

  const confirm = async () => {
    const clean = items.filter((it) => it.nombre.trim());
    if (clean.length === 0) return;
    setApplying(true);
    try {
      const { added, updated } = await applyReceiptItems(clean, products, categories);
      const parts = [
        added > 0 ? `${added} ${added === 1 ? 'nuevo' : 'nuevos'}` : '',
        updated > 0 ? `${updated} actualizado${updated === 1 ? '' : 's'}` : '',
      ].filter(Boolean);
      toast(`Añadido por voz · ${parts.join(' y ') || 'sin cambios'}`, 'success');
      close();
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      {listening ? (
        <Button variant="secondary" className="w-full" onClick={stop}>
          <Square size={16} aria-hidden="true" className="shrink-0 animate-pulse text-danger" />
          <span className="truncate">{transcript || 'Escuchando…'}</span>
        </Button>
      ) : (
        <Button variant="secondary" className="w-full" onClick={start}>
          <Mic size={18} aria-hidden="true" />
          Dictar
        </Button>
      )}

      <ItemsReviewSheet
        open={phase !== 'idle'}
        onClose={close}
        title="Revisa lo dictado"
        loading={phase === 'parsing'}
        loadingText="Interpretando…"
        error={error}
        emptyTitle="No he entendido ningún producto"
        emptyDescription="Prueba a decir algo como “añade dos leches y un pan”."
        items={items}
        onChange={setItems}
        onConfirm={confirm}
        applying={applying}
      />
    </>
  );
}
