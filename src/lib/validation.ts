import { z } from "zod";

/** Collapse runs of whitespace and trim, so "  OPD   1 " and "OPD 1" are the same name. */
export function normaliseText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export const QUEUE_NAME_MAX = 60;
export const TOKEN_LABEL_MAX = 60;

export const queueNameSchema = z
  .string()
  .transform(normaliseText)
  .pipe(
    z
      .string()
      .min(1, "Give the queue a name.")
      .max(QUEUE_NAME_MAX, `Keep the name under ${QUEUE_NAME_MAX} characters.`),
  );

export const tokenLabelSchema = z
  .string()
  .transform(normaliseText)
  .pipe(z.string().max(TOKEN_LABEL_MAX, `Keep the name or note under ${TOKEN_LABEL_MAX} characters.`))
  .transform((v) => (v === "" ? null : v));

export const uuidSchema = z.uuid();

export const moveSchema = z.object({ direction: z.enum(["up", "down"]) });

export const serveSchema = z.object({ expectedTokenId: z.uuid().optional() });

export const rangeSchema = z.enum(["today", "7d", "30d"]);
export type Range = z.infer<typeof rangeSchema>;
