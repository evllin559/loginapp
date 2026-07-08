import Database from "better-sqlite3";
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

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "prospeccao.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS prospects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      empresa TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      endereco TEXT NOT NULL,
      cidade TEXT NOT NULL,
      estado TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      segmento TEXT,
      status TEXT NOT NULL DEFAULT 'novo',
      observacoes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospect_id INTEGER NOT NULL,
      mensagem TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      whatsapp_message_id TEXT,
      erro TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
    CREATE INDEX IF NOT EXISTS idx_prospects_coords ON prospects(latitude, longitude);
  `);
}

export function listProspects(filters?: {
  status?: ProspectStatus;
  cidade?: string;
  segmento?: string;
}): Prospect[] {
  const database = getDb();
  let query = "SELECT * FROM prospects WHERE 1=1";
  const params: (string | number)[] = [];

  if (filters?.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  if (filters?.cidade) {
    query += " AND cidade LIKE ?";
    params.push(`%${filters.cidade}%`);
  }
  if (filters?.segmento) {
    query += " AND segmento LIKE ?";
    params.push(`%${filters.segmento}%`);
  }

  query += " ORDER BY updated_at DESC";
  return database.prepare(query).all(...params) as Prospect[];
}

export function getProspect(id: number): Prospect | undefined {
  const database = getDb();
  return database.prepare("SELECT * FROM prospects WHERE id = ?").get(id) as
    | Prospect
    | undefined;
}

export function createProspect(
  data: Omit<Prospect, "id" | "created_at" | "updated_at">
): Prospect {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO prospects (nome, empresa, telefone, email, endereco, cidade, estado, latitude, longitude, segmento, status, observacoes)
    VALUES (@nome, @empresa, @telefone, @email, @endereco, @cidade, @estado, @latitude, @longitude, @segmento, @status, @observacoes)
  `);
  const result = stmt.run(data);
  return getProspect(Number(result.lastInsertRowid))!;
}

export function updateProspect(
  id: number,
  data: Partial<Omit<Prospect, "id" | "created_at" | "updated_at">>
): Prospect | undefined {
  const existing = getProspect(id);
  if (!existing) return undefined;

  const merged = { ...existing, ...data, updated_at: new Date().toISOString() };
  const database = getDb();
  database
    .prepare(`
      UPDATE prospects SET
        nome = @nome, empresa = @empresa, telefone = @telefone, email = @email,
        endereco = @endereco, cidade = @cidade, estado = @estado,
        latitude = @latitude, longitude = @longitude, segmento = @segmento,
        status = @status, observacoes = @observacoes, updated_at = @updated_at
      WHERE id = @id
    `)
    .run({ ...merged, id });

  return getProspect(id);
}

export function deleteProspect(id: number): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM prospects WHERE id = ?").run(id);
  return result.changes > 0;
}

export function findProspectsNearby(
  lat: number,
  lng: number,
  radiusKm: number
): (Prospect & { distancia_km: number })[] {
  const prospects = listProspects().filter((p) => p.latitude != null && p.longitude != null);

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
  const database = getDb();
  const result = database
    .prepare(`
      INSERT INTO message_logs (prospect_id, mensagem, status, whatsapp_message_id, erro)
      VALUES (@prospect_id, @mensagem, @status, @whatsapp_message_id, @erro)
    `)
    .run({
      prospect_id: data.prospect_id,
      mensagem: data.mensagem,
      status: data.status,
      whatsapp_message_id: data.whatsapp_message_id ?? null,
      erro: data.erro ?? null,
    });

  return database
    .prepare("SELECT * FROM message_logs WHERE id = ?")
    .get(result.lastInsertRowid) as MessageLog;
}

export function listMessageLogs(prospectId?: number): MessageLog[] {
  const database = getDb();
  if (prospectId) {
    return database
      .prepare("SELECT * FROM message_logs WHERE prospect_id = ? ORDER BY created_at DESC")
      .all(prospectId) as MessageLog[];
  }
  return database
    .prepare("SELECT * FROM message_logs ORDER BY created_at DESC LIMIT 100")
    .all() as MessageLog[];
}
