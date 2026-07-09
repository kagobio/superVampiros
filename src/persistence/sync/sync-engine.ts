import { signInAnonymously } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type CollectionReference,
} from 'firebase/firestore';
import type { Entity } from '@/domain/shared/entity';
import { getDb, getFirebaseAuth } from './firebase-client';
import { SYNCED_TABLES } from './synced-tables';
import {
  docId,
  householdIdFromKey,
  shouldApplyIncoming,
  toDocument,
  type SyncDocument,
} from './reconcile';
import { useSyncStore } from '@/stores/sync.store';

let colRef: CollectionReference | null = null;
let unsubscribe: (() => void) | null = null;
/** Evita el "eco": no reenviar al servidor los cambios que vienen del servidor. */
let applyingRemote = false;
/** Handlers de los hooks de Dexie, para poder quitarlos al desconectar. */
const hookHandles: Array<() => void> = [];

const status = () => useSyncStore.getState();

/** Aplica un documento remoto al Dexie local con política last-write-wins. */
async function applyRemoteDoc(row: SyncDocument): Promise<void> {
  const table = SYNCED_TABLES[row.entityType];
  if (!table || !row.doc) return;
  const local = await table.get(row.entityId);
  if (!shouldApplyIncoming(local, { updatedAt: row.updatedAt, revision: row.revision })) return;
  applyingRemote = true;
  try {
    await table.put(row.doc);
  } finally {
    applyingRemote = false;
  }
}

/** Sube una entidad local a Firestore. */
async function pushEntity(entityType: string, entity: Entity): Promise<void> {
  if (!colRef) return;
  try {
    const batch = writeBatch(colRef.firestore);
    batch.set(doc(colRef, docId(entityType, entity.id)), toDocument(entityType, entity));
    await batch.commit();
    status().markSynced();
  } catch (e) {
    status().setStatus('error', e instanceof Error ? e.message : 'Error al sincronizar');
  }
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

/** Reconciliación inicial: baja lo remoto (LWW) y luego sube lo local. */
async function initialSync(): Promise<void> {
  if (!colRef) return;

  const snapshot = await getDocs(colRef);
  for (const d of snapshot.docs) await applyRemoteDoc(d.data() as SyncDocument);

  let batch = writeBatch(colRef.firestore);
  let count = 0;
  for (const [entityType, table] of Object.entries(SYNCED_TABLES)) {
    const rows = (await table.toArray()) as Entity[];
    for (const entity of rows) {
      batch.set(doc(colRef, docId(entityType, entity.id)), toDocument(entityType, entity));
      count++;
      // Firestore limita a 500 operaciones por lote.
      if (count % 400 === 0) {
        await batch.commit();
        batch = writeBatch(colRef.firestore);
      }
    }
  }
  if (count % 400 !== 0) await batch.commit();
}

/** Suscripción en tiempo real: aplica los cambios remotos según llegan. */
function subscribeRealtime(): void {
  if (!colRef) return;
  unsubscribe = onSnapshot(colRef, (snap) => {
    snap.docChanges().forEach((change) => {
      // Ignora los ecos de nuestras propias escrituras pendientes.
      if (change.doc.metadata.hasPendingWrites) return;
      if (change.type === 'removed') return;
      void applyRemoteDoc(change.doc.data() as SyncDocument);
    });
    status().markSynced();
  });
}

/**
 * Conecta la sincronización: sesión anónima, deriva el hogar de la clave, hace
 * la reconciliación inicial y se suscribe a los cambios en tiempo real.
 */
export async function connectSync(householdKey: string): Promise<void> {
  const auth = getFirebaseAuth();
  const db = getDb();
  if (!auth || !db) {
    status().setStatus('error', 'Sincronización no configurada.');
    return;
  }
  status().setStatus('connecting');
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
    const householdId = await householdIdFromKey(householdKey);
    colRef = collection(db, 'households', householdId, 'docs');

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
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  colRef = null;
  status().setStatus('off');
}
