import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Entity } from '@/domain/shared/entity';
import { getSupabase } from './supabase-client';
import { SYNCED_TABLES } from './synced-tables';
import { shouldApplyIncoming, toDocument, type SyncDocument } from './reconcile';
import { useSyncStore } from '@/stores/sync.store';

const DOCUMENTS = 'documents';

let householdId: string | null = null;
let channel: RealtimeChannel | null = null;
/** Evita el "eco": no reenviar al servidor los cambios que vienen del servidor. */
let applyingRemote = false;
/** Handlers de los hooks de Dexie, para poder quitarlos al desconectar. */
const hookHandles: Array<() => void> = [];

const status = () => useSyncStore.getState();

/** Aplica un documento remoto al Dexie local con política last-write-wins. */
async function applyRemoteDoc(row: SyncDocument): Promise<void> {
  const table = SYNCED_TABLES[row.entity_type];
  if (!table) return;
  const local = await table.get(row.entity_id);
  if (!shouldApplyIncoming(local, { updatedAt: row.updated_at, revision: row.revision })) return;
  applyingRemote = true;
  try {
    await table.put(row.doc);
  } finally {
    applyingRemote = false;
  }
}

/** Sube una entidad local a la tabla `documents` (upsert). */
async function pushEntity(entityType: string, entity: Entity): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !householdId) return;
  const { error } = await supabase
    .from(DOCUMENTS)
    .upsert(toDocument(householdId, entityType, entity), {
      onConflict: 'household_id,entity_type,entity_id',
    });
  if (error) status().setStatus('error', error.message);
  else status().markSynced();
}

/** Registra hooks en las tablas sincronizadas para propagar los cambios locales. */
function attachHooks(): void {
  for (const [entityType, table] of Object.entries(SYNCED_TABLES)) {
    const onCreate = (_key: string, obj: Entity) => {
      if (!applyingRemote) void pushEntity(entityType, obj);
    };
    const onUpdate = (mods: Partial<Entity>, _key: string, obj: Entity) => {
      if (!applyingRemote) void pushEntity(entityType, { ...obj, ...mods });
    };
    table.hook('creating', onCreate);
    table.hook('updating', onUpdate);
    hookHandles.push(() => table.hook('creating').unsubscribe(onCreate));
    hookHandles.push(() => table.hook('updating').unsubscribe(onUpdate));
  }
}

function detachHooks(): void {
  while (hookHandles.length) hookHandles.pop()?.();
}

/** Reconciliación inicial: baja lo remoto (LWW) y sube lo local. */
async function initialSync(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !householdId) return;

  const { data, error } = await supabase
    .from(DOCUMENTS)
    .select('*')
    .eq('household_id', householdId);
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as SyncDocument[]) await applyRemoteDoc(row);

  const docs: SyncDocument[] = [];
  for (const [entityType, table] of Object.entries(SYNCED_TABLES)) {
    const rows = (await table.toArray()) as Entity[];
    for (const entity of rows) docs.push(toDocument(householdId, entityType, entity));
  }
  if (docs.length > 0) {
    const { error: upErr } = await supabase
      .from(DOCUMENTS)
      .upsert(docs, { onConflict: 'household_id,entity_type,entity_id' });
    if (upErr) throw new Error(upErr.message);
  }
}

/** Suscripción realtime: aplica los cambios remotos según llegan. */
function subscribeRealtime(): void {
  const supabase = getSupabase();
  if (!supabase || !householdId) return;
  channel = supabase
    .channel(`documents-${householdId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: DOCUMENTS, filter: `household_id=eq.${householdId}` },
      (payload) => {
        const row = payload.new as SyncDocument | undefined;
        if (row?.doc) void applyRemoteDoc(row);
      },
    )
    .subscribe();
}

/**
 * Conecta la sincronización: inicia sesión anónima, se une al hogar con la clave,
 * hace la reconciliación inicial y se suscribe a los cambios en tiempo real.
 */
export async function connectSync(householdKey: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    status().setStatus('error', 'Sincronización no configurada.');
    return;
  }
  status().setStatus('connecting');
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw new Error(error.message);
    }

    const { data: hid, error: rpcErr } = await supabase.rpc('join_household', {
      secret: householdKey,
    });
    if (rpcErr) throw new Error(rpcErr.message);
    householdId = hid as string;

    await initialSync();
    attachHooks();
    subscribeRealtime();
    status().markSynced();
  } catch (e) {
    status().setStatus('error', e instanceof Error ? e.message : 'Error de sincronización');
  }
}

/** Detiene la sincronización (mantiene la sesión para reconectar rápido). */
export async function disconnectSync(): Promise<void> {
  detachHooks();
  if (channel) {
    await getSupabase()?.removeChannel(channel);
    channel = null;
  }
  householdId = null;
  status().setStatus('off');
}
