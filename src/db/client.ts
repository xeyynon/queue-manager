import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

// One pool per process. In dev, Next re-evaluates modules on every edit, so the
// pool is parked on globalThis to avoid leaking connections to Neon.
const globalForDb = globalThis as unknown as { __qmPool?: Pool; __qmDb?: Db };

export function createDb(connectionString: string, max = 5): { db: Db; pool: Pool } {
  const pool = new Pool({ connectionString, max, idleTimeoutMillis: 10_000 });
  return { db: drizzle(pool, { schema }), pool };
}

export function getDb(): Db {
  if (!globalForDb.__qmDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local.");
    const { db, pool } = createDb(url);
    globalForDb.__qmPool = pool;
    globalForDb.__qmDb = db;
  }
  return globalForDb.__qmDb;
}
