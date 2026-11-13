import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, type Db } from "@/db/client";
import { uuidSchema } from "@/lib/validation";
import { getSessionUser, type SessionUser } from "./auth";
import { AppError } from "./errors";

export function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Wrap a route: require a signed-in manager and turn known errors into clean JSON. */
export function withUser<C>(handler: (ctx: { req: Request; user: SessionUser; db: Db; route: C }) => Promise<Response>) {
  return async (req: Request, route: C): Promise<Response> => {
    try {
      const user = await getSessionUser();
      if (!user) return errorResponse("UNAUTHORIZED", "Your session has ended. Please sign in again.", 401);
      return await handler({ req, user, db: getDb(), route });
    } catch (err) {
      if (err instanceof AppError) return errorResponse(err.code, err.message, err.status);
      if (err instanceof z.ZodError) {
        return errorResponse("VALIDATION", err.issues[0]?.message ?? "Invalid input.", 400);
      }
      console.error("[api] unexpected error", err);
      return errorResponse("INTERNAL", "Something went wrong on our side. Please try again.", 500);
    }
  };
}

/** Parse a JSON body; an empty or malformed body becomes {} so schemas report a clean error. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    throw new AppError("VALIDATION", "The request body isn't valid JSON.");
  }
}

/** A malformed id can never match a row, so treat it as not found (and never hit Postgres with it). */
export function parseId(value: string, what = "queue"): string {
  const r = uuidSchema.safeParse(value);
  if (!r.success) throw new AppError("NOT_FOUND", `This ${what} doesn't exist or isn't yours.`);
  return r.data;
}
