import { z } from "zod";
import { tokenLabelSchema } from "@/lib/validation";
import { addToken } from "@/server/queue-service";
import { json, parseId, readJson, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withUser<Ctx>(async ({ req, user, db, route }) => {
  const id = parseId((await route.params).id);
  const { label } = z.object({ label: tokenLabelSchema.optional() }).parse(await readJson(req));
  return json({ token: await addToken(db, user.id, id, label ?? null) }, 201);
});
