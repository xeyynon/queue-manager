import path from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb, type Db } from "@/db/client";
import { user } from "@/db/schema";

config({ path: path.resolve(__dirname, "../../.env.local") });

/**
 * DB tests wipe their database. They only ever run against TEST_DATABASE_URL
 * (a separate Neon branch) and refuse to start if it equals DATABASE_URL.
 */
export function testDbUrl(): string | null {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) return null;
  if (url === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must point at a separate database/branch; tests delete all data.");
  }
  return url;
}

export async function openTestDb() {
  const url = testDbUrl();
  if (!url) throw new Error("TEST_DATABASE_URL not set");
  const { db, pool } = createDb(url, 15);
  await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
  return { db, pool };
}

export async function resetDb(db: Db) {
  await db.execute(sql`truncate table queue_events, tokens, queues, session, account, verification, "user" cascade`);
}

export async function makeUser(db: Db, id: string) {
  await db.insert(user).values({ id, name: `Manager ${id}`, email: `${id}@test.local` });
  return id;
}
