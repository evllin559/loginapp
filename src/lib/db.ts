import fs from "fs";
import path from "path";

export type ProspectStatus =
  | "novo"
  | "contatado"
  | "interessado"
  | "negociando"
  | "fechado"
  | "descartado";

export interface Prospect {
  id: number;
  nome: string;
  empresa: string;
  telefone: string;
  email: string | null;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: number | null;
  longitude: number | null;
  segmento: string | null;
  status: ProspectStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: number;
  prospect_id: number;
  mensagem: string;
  status: "enviado" | "erro" | "pendente";
  whatsapp_message_id: string | null;
  erro: string | null;
  created_at: string;
}

interface DbShape {
  prospects: Prospect[];
  message_logs: MessageLog[];
  nextProspectId: number;
  nextMessageId: number;
}

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "prospeccao.json");

let cache: DbShape | null = null;

function emptyDb(): DbShape {
  return {
    prospects: [],
    message_logs: [],
    nextProspectId: 1,
    nextMessageId: 1,
  };
}

function loadDb(): DbShape {
  if (cache) return cache;

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    cache = emptyDb();
    saveDb(cache);
    return cache;
  }

  try {
    const raw = fs.readFileSync(dbPath, "utf8");
    cache = JSON.parse(raw) as DbShape;
    return cache;
  } catch {
    cache = emptyDb();
    saveDb(cache);
    return cache;
  }
}

function saveDb(db: DbShape) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  cache = db;
}

function nowIso() {
  return new Date().toISOString();
}

export function listProspects(filters?: {
  status?: ProspectStatus;
  cidade?: string;
  segmento?: string;
}): Prospect[] {
  let items = [...loadDb().prospects];

  if (filters?.status) {
    items = items.filter((p) => p.status === filters.status);
  }
  if (filters?.cidade) {
    const q = filters.cidade.toLowerCase();
    items = items.filter((p) => p.cidade.toLowerCase().includes(q));
  }
  if (filters?.segmento) {
    const q = filters.segmento.toLowerCase();
    items = items.filter((p) => (p.segmento || "").toLowerCase().includes(q));
  }

  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getProspect(id: number): Prospect | undefined {
  return loadDb().prospects.find((p) => p.id === id);
}

export function createProspect(
  data: Omit<Prospect, "id" | "created_at" | "updated_at">
): Prospect {
  const db = loadDb();
  const stamp = nowIso();
  const prospect: Prospect = {
    ...data,
    id: db.nextProspectId++,
    created_at: stamp,
    updated_at: stamp,
  };
  db.prospects.push(prospect);
  saveDb(db);
  return prospect;
}

export function updateProspect(
  id: number,
  data: Partial<Omit<Prospect, "id" | "created_at" | "updated_at">>
): Prospect | undefined {
  const db = loadDb();
  const idx = db.prospects.findIndex((p) => p.id === id);
  if (idx < 0) return undefined;

  db.prospects[idx] = {
    ...db.prospects[idx],
    ...data,
    id,
    updated_at: nowIso(),
  };
  saveDb(db);
  return db.prospects[idx];
}

export function deleteProspect(id: number): boolean {
  const db = loadDb();
  const before = db.prospects.length;
  db.prospects = db.prospects.filter((p) => p.id !== id);
  db.message_logs = db.message_logs.filter((m) => m.prospect_id !== id);
  if (db.prospects.length === before) return false;
  saveDb(db);
  return true;
}

export function findProspectsNearby(
  lat: number,
  lng: number,
  radiusKm: number
): (Prospect & { distancia_km: number })[] {
  const prospects = listProspects().filter(
    (p) => p.latitude != null && p.longitude != null
  );

  return prospects
    .map((p) => ({
      ...p,
      distancia_km: haversineKm(lat, lng, p.latitude!, p.longitude!),
    }))
    .filter((p) => p.distancia_km <= radiusKm)
    .sort((a, b) => a.distancia_km - b.distancia_km);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function createMessageLog(data: {
  prospect_id: number;
  mensagem: string;
  status: MessageLog["status"];
  whatsapp_message_id?: string | null;
  erro?: string | null;
}): MessageLog {
  const db = loadDb();
  const log: MessageLog = {
    id: db.nextMessageId++,
    prospect_id: data.prospect_id,
    mensagem: data.mensagem,
    status: data.status,
    whatsapp_message_id: data.whatsapp_message_id ?? null,
    erro: data.erro ?? null,
    created_at: nowIso(),
  };
  db.message_logs.push(log);
  saveDb(db);
  return log;
}

export function listMessageLogs(prospectId?: number): MessageLog[] {
  const logs = [...loadDb().message_logs];
  const filtered = prospectId
    ? logs.filter((l) => l.prospect_id === prospectId)
    : logs;
  return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
}
