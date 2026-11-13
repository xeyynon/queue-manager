import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Better Auth tables (field names must match what Better Auth expects) */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/* ------------------------------------------------------------------ */
/* Queue domain                                                        */
/* ------------------------------------------------------------------ */

export const queues = pgTable(
  "queues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Counters live on the queue row. Every mutation locks this row first
    // (SELECT ... FOR UPDATE), so increments are serialised and never collide.
    nextTokenNo: integer("next_token_no").notNull().default(1),
    nextPosition: integer("next_position").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One owner cannot have two queues whose names differ only by case/spaces.
    uniqueIndex("queues_owner_name_uq").on(t.ownerId, sql`lower(${t.name})`),
  ],
);

export const tokenStatus = pgEnum("token_status", ["waiting", "served", "cancelled"]);

export const tokens = pgTable(
  "tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    queueId: uuid("queue_id")
      .notNull()
      .references(() => queues.id, { onDelete: "cascade" }),
    // Human-facing number (#17). Unique per queue, never reused.
    number: integer("number").notNull(),
    // Optional name / note typed by the manager ("Ravi K", "wheelchair").
    label: text("label"),
    status: tokenStatus("status").notNull().default("waiting"),
    // Sort key among waiting tokens. Unique per queue; a cancelled token keeps
    // its position so "Undo" can put it back exactly where it was.
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    servedAt: timestamp("served_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    // Last manual reorder, shown as a "moved" badge so reorders are visible.
    lastMove: text("last_move", { enum: ["up", "down"] }),
    lastMovedAt: timestamp("last_moved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("tokens_queue_number_uq").on(t.queueId, t.number),
    uniqueIndex("tokens_queue_position_uq").on(t.queueId, t.position),
    index("tokens_queue_status_pos_idx").on(t.queueId, t.status, t.position),
    index("tokens_queue_served_at_idx").on(t.queueId, t.servedAt),
    check(
      "tokens_status_timestamps_ck",
      sql`(${t.status} = 'waiting' AND ${t.servedAt} IS NULL AND ${t.cancelledAt} IS NULL)
       OR (${t.status} = 'served' AND ${t.servedAt} IS NOT NULL AND ${t.cancelledAt} IS NULL)
       OR (${t.status} = 'cancelled' AND ${t.cancelledAt} IS NOT NULL AND ${t.servedAt} IS NULL)`,
    ),
  ],
);

export const eventType = pgEnum("queue_event_type", [
  "token_added",
  "moved_up",
  "moved_down",
  "served",
  "cancelled",
  "restored",
]);

// Append-only log of every action. The dashboard's queue-length chart reads
// `waitingAfter` straight from here; the activity feed is the audit trail.
export const queueEvents = pgTable(
  "queue_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    queueId: uuid("queue_id")
      .notNull()
      .references(() => queues.id, { onDelete: "cascade" }),
    tokenId: uuid("token_id").references(() => tokens.id, { onDelete: "set null" }),
    tokenNumber: integer("token_number"),
    type: eventType("type").notNull(),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    waitingAfter: integer("waiting_after").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("queue_events_queue_at_idx").on(t.queueId, t.at)],
);

export type Queue = typeof queues.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type QueueEvent = typeof queueEvents.$inferSelect;
