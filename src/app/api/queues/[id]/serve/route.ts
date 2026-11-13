import { serveSchema } from "@/lib/validation";
import { serveNext } from "@/server/queue-service";
import { json, parseId, readJson, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const POST = withUser<Ctx>(async ({ req, user, db, route }) => {
  const id = parseId((await route.params).id);
  const { expectedTokenId } = serveSchema.parse(await readJson(req));
  return json({ token: await serveNext(db, user.id, id, expectedTokenId) });
});
