/**
 * API client centralizado para o backend FastAPI da Polar Soluções.
 * Usado pelo modo offline-first do mobile e pelo web admin.
 *
 * IMPORTANTE: O fallback abaixo é usado quando o app é compilado SEM o .env
 * (ex: build no GitHub Actions). Para apontar para outro backend, altere
 * a variável EXPO_PUBLIC_BACKEND_URL no arquivo /app/frontend/.env
 * (ou no workflow do GitHub Actions).
 */

const FALLBACK_BACKEND = "https://code-zip-uploader.preview.emergentagent.com";
const BACKEND = ((process.env.EXPO_PUBLIC_BACKEND_URL || FALLBACK_BACKEND) as string).replace(/\/$/, "");
export const API_BASE = `${BACKEND}/api`;

async function req<T>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : (undefined as any);
}

export const api = {
  get: <T>(p: string) => req<T>("GET", p),
  post: <T>(p: string, b: any) => req<T>("POST", p, b),
  put: <T>(p: string, b: any) => req<T>("PUT", p, b),
  del: <T>(p: string) => req<T>("DELETE", p),
};

export type Collection =
  | "clientes"
  | "equipamentos"
  | "ordens"
  | "orcamentos"
  | "cobrancas"
  | "saidas"
  | "entradas"
  | "eventos"
  | "recibos"
  | "produtos"
  | "movimentacoes_estoque";

export const remote = {
  list: <T = any>(c: Collection) => api.get<T[]>(`/${c}`),
  get: <T = any>(c: Collection, id: string) => api.get<T>(`/${c}/${id}`),
  upsert: <T = any>(c: Collection, item: any) => api.post<T>(`/${c}`, item),
  update: <T = any>(c: Collection, id: string, patch: any) =>
    api.put<T>(`/${c}/${id}`, patch),
  delete: (c: Collection, id: string) => api.del<{ deleted: boolean }>(`/${c}/${id}`),
  empresa: {
    get: () => api.get<any>("/empresa"),
    update: (cfg: any) => api.put<any>("/empresa", cfg),
  },
  sync: {
    push: (payload: Record<string, any[]>) => api.post<any>("/sync/push", payload),
    pull: () => api.get<any>("/sync/pull"),
  },
  dashboard: () => api.get<any>("/dashboard"),
};
