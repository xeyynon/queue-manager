import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

// Public URL of the app. Locally: BETTER_AUTH_URL from .env.local. On Vercel, if
// BETTER_AUTH_URL isn't set, use the production domain Vercel exposes at runtime.
function baseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return prod ? `https://${prod}` : undefined;
}

function buildAuth() {
  return betterAuth({
    baseURL: baseURL(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh once a day of use
    },
    // In-memory rate limit on auth endpoints (sign-in brute force; Better Auth adds
    // a stricter 3-per-10s rule on sign-in/sign-up). Only the E2E test server turns
    // it off (playwright.config.ts), because the suite signs up many users per minute.
    rateLimit: { enabled: process.env.E2E_DISABLE_RATE_LIMIT !== "1", window: 60, max: 30 },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof buildAuth>;
const globalForAuth = globalThis as unknown as { __qmAuth?: Auth };

// Built lazily so `next build` never needs DATABASE_URL.
export function getAuth(): Auth {
  if (!globalForAuth.__qmAuth) globalForAuth.__qmAuth = buildAuth();
  return globalForAuth.__qmAuth;
}

export type SessionUser = { id: string; name: string; email: string; isDemo: boolean };

/** The signed-in manager, or null. Used by pages and API routes alike. */
export async function getSessionUser(): Promise<SessionUser | null> {
  // Read request headers first: that marks the route dynamic, so `next build`
  // never tries to prerender it (and never needs a database).
  const h = await headers();
  const result = await getAuth().api.getSession({ headers: h });
  if (!result) return null;
  const { id, name, email } = result.user;
  // The demo account holds simulated history; every screen says so (DEC-010).
  const isDemo = !!process.env.DEMO_EMAIL && email.toLowerCase() === process.env.DEMO_EMAIL.toLowerCase();
  return { id, name, email, isDemo };
}
