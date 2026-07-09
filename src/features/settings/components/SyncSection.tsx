import { useState } from 'react';
import { Check, Copy, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { isSyncConfigured } from '@/config/env';
import { connectSync, disconnectSync } from '@/persistence/sync/sync-engine';
import { generateHouseholdKey, useSyncStore } from '@/stores/sync.store';
import { toast } from '@/stores/toast.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatRelativeTime } from '@/lib/date';
import { cn } from '@/lib/cn';

export function SyncSection() {
  const { enabled, householdKey, status, error, lastSyncAt, setConfig } = useSyncStore();
  const [keyDraft, setKeyDraft] = useState(householdKey ?? '');
  const [copied, setCopied] = useState(false);
  const [now] = useState(() => Date.now());

  if (!isSyncConfigured) {
    return (
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-text">Sincronización</h2>
        <p className="rounded-2xl border border-border bg-surface p-3 text-sm text-muted">
          Aún no está configurada. Necesita las variables <code>VITE_SUPABASE_URL</code> y{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> (ver <code>README</code>).
        </p>
      </section>
    );
  }

  const connect = async () => {
    const key = keyDraft.trim();
    if (!key) return;
    setConfig({ enabled: true, householdKey: key });
    await connectSync(key);
  };

  const disconnect = async () => {
    setConfig({ enabled: false, householdKey });
    await disconnectSync();
    toast('Sincronización desactivada', 'default');
  };

  const copyKey = async () => {
    if (!householdKey) return;
    await navigator.clipboard.writeText(householdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-text">Sincronización entre dispositivos</h2>

      {!enabled ? (
        <div className="space-y-2 rounded-2xl border border-border bg-surface p-3">
          <p className="text-sm text-muted">
            Usa la <strong>misma clave de hogar</strong> en tus dos móviles para compartir el
            inventario. Genera una aquí y cópiala en el otro dispositivo.
          </p>
          <div className="flex items-center gap-2">
            <Input
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value)}
              placeholder="Clave del hogar"
              aria-label="Clave del hogar"
            />
            <Button variant="secondary" onClick={() => setKeyDraft(generateHouseholdKey())}>
              Generar
            </Button>
          </div>
          <Button onClick={connect} disabled={!keyDraft.trim()} className="w-full">
            <Wifi size={18} aria-hidden="true" />
            Activar sincronización
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl',
                status === 'live'
                  ? 'bg-success/15 text-success'
                  : status === 'error'
                    ? 'bg-danger/15 text-danger'
                    : 'bg-surface-2 text-muted',
              )}
            >
              {status === 'error' ? <WifiOff size={18} /> : <Wifi size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">
                {status === 'live'
                  ? 'Sincronizado'
                  : status === 'connecting'
                    ? 'Conectando…'
                    : status === 'error'
                      ? 'Error de sincronización'
                      : 'Activada'}
              </p>
              <p className="truncate text-xs text-muted">
                {status === 'error' && error
                  ? error
                  : lastSyncAt
                    ? `Última vez: ${formatRelativeTime(lastSyncAt, now)}`
                    : 'Esperando…'}
              </p>
            </div>
            {status === 'error' && householdKey ? (
              <Button size="sm" variant="secondary" onClick={() => connectSync(householdKey)}>
                <RefreshCw size={16} aria-hidden="true" />
                Reintentar
              </Button>
            ) : null}
          </div>

          <div>
            <p className="mb-1 text-xs text-muted">
              Clave del hogar (cópiala en tu otro dispositivo):
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-2 px-2 py-1.5 text-xs">
                {householdKey}
              </code>
              <Button size="sm" variant="secondary" onClick={copyKey}>
                {copied ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Copy size={16} aria-hidden="true" />
                )}
                {copied ? 'Copiada' : 'Copiar'}
              </Button>
            </div>
          </div>

          <Button variant="ghost" onClick={disconnect} className="w-full text-danger">
            <WifiOff size={18} aria-hidden="true" />
            Desactivar
          </Button>
        </div>
      )}
    </section>
  );
}
