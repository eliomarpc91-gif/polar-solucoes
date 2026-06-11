/**
 * Sync engine offline-first.
 * - Lê e escreve no AsyncStorage (modo offline).
 * - Em background, sincroniza com o backend FastAPI.
 * - Em caso de conflito, vence o lado com `atualizadoEm` mais recente; senão, o servidor.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { remote, Collection } from "./api-client";

const PUSH_DEBOUNCE_MS = 1500;
const LAST_SYNC_KEY = "@polar/_last_sync_ts";

const COLLECTIONS: { key: string; storageKey: string; collection: Collection }[] = [
  { key: "clientes", storageKey: "@polar/clientes", collection: "clientes" },
  { key: "equipamentos", storageKey: "@polar/equipamentos", collection: "equipamentos" },
  { key: "ordens", storageKey: "@polar/os", collection: "ordens" },
  { key: "orcamentos", storageKey: "@polar/orcamentos", collection: "orcamentos" },
  { key: "cobrancas", storageKey: "@polar/cobrancas", collection: "cobrancas" },
  { key: "saidas", storageKey: "@polar/saidas_manuais", collection: "saidas" },
  { key: "entradas", storageKey: "@polar/entradas_automaticas", collection: "entradas" },
  { key: "eventos", storageKey: "@polar/eventos", collection: "eventos" },
  { key: "recibos", storageKey: "@polar/recibos", collection: "recibos" },
];

let pushTimer: any = null;
let syncListeners: Array<(status: "ok" | "error" | "running") => void> = [];

export function onSyncStatus(cb: (s: "ok" | "error" | "running") => void) {
  syncListeners.push(cb);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== cb);
  };
}

function emit(s: "ok" | "error" | "running") {
  syncListeners.forEach((l) => {
    try {
      l(s);
    } catch {}
  });
}

async function readLocal(storageKey: string): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeLocal(storageKey: string, items: any[]) {
  await AsyncStorage.setItem(storageKey, JSON.stringify(items));
}

function mergeById(local: any[], remoteItems: any[]): any[] {
  const map = new Map<string, any>();
  for (const it of local) if (it?.id) map.set(it.id, it);
  for (const r of remoteItems) {
    if (!r?.id) continue;
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, r);
      continue;
    }
    const aTs = existing.atualizadoEm || existing.atualizado_em || existing.criadoEm || "";
    const bTs = r.atualizadoEm || r.atualizado_em || r.criadoEm || "";
    map.set(r.id, bTs > aTs ? r : existing);
  }
  return Array.from(map.values());
}

/**
 * Faz pull do backend e mescla com o local.
 */
export async function pullAll(): Promise<void> {
  emit("running");
  try {
    const data = await remote.sync.pull();
    for (const c of COLLECTIONS) {
      const remoteItems: any[] = (data as any)[c.key] || [];
      const local = await readLocal(c.storageKey);
      const merged = mergeById(local, remoteItems);
      await writeLocal(c.storageKey, merged);
    }
    // Empresa
    if (data?.empresa && Object.keys(data.empresa).length) {
      await AsyncStorage.setItem("@polar/config", JSON.stringify(data.empresa));
    }
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    emit("ok");
  } catch (e) {
    emit("error");
    throw e;
  }
}

/**
 * Faz push de tudo que está local para o backend.
 */
export async function pushAll(): Promise<void> {
  emit("running");
  try {
    const payload: Record<string, any[]> = {};
    for (const c of COLLECTIONS) {
      payload[c.key] = await readLocal(c.storageKey);
    }
    const empRaw = await AsyncStorage.getItem("@polar/config");
    if (empRaw) {
      try {
        (payload as any).empresa = JSON.parse(empRaw);
      } catch {}
    }
    await remote.sync.push(payload);
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    emit("ok");
  } catch (e) {
    emit("error");
    throw e;
  }
}

/**
 * Push individual com debounce — usado quando o app salva uma única entidade.
 */
export function schedulePush(collection: Collection, item: any) {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    try {
      emit("running");
      await remote.upsert(collection, item);
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      emit("ok");
    } catch (e) {
      console.warn("[sync] push falhou (offline?)", e);
      emit("error");
    }
  }, PUSH_DEBOUNCE_MS);
}

/**
 * Delete remoto - chamado junto com o delete local.
 */
export async function pushDelete(collection: Collection, id: string) {
  try {
    await remote.delete(collection, id);
  } catch (e) {
    console.warn("[sync] delete falhou (offline?)", e);
  }
}

/**
 * Sincronização completa (pull + push). Pode ser chamada na inicialização do app.
 */
export async function fullSync(): Promise<{ ok: boolean; error?: string }> {
  try {
    await pullAll();
    await pushAll();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Erro de sincronização" };
  }
}

export async function getLastSyncTs(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SYNC_KEY);
}
