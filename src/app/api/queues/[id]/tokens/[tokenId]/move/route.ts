import { moveSchema } from "@/lib/validation";
import { moveToken } from "@/server/queue-service";
import { json, parseId, readJson, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string; tokenId: string }> };

export const POST = withUser<Ctx>(async ({ req, user, db, route }) => {
  const p = await route.params;
  const { direction } = moveSchema.parse(await readJson(req));
  return json(await moveToken(db, user.id, parseId(p.id), parseId(p.tokenId, "token"), direction));
});
