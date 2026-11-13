import { restoreToken } from "@/server/queue-service";
import { json, parseId, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string; tokenId: string }> };

export const POST = withUser<Ctx>(async ({ user, db, route }) => {
  const p = await route.params;
  return json({ token: await restoreToken(db, user.id, parseId(p.id), parseId(p.tokenId, "token")) });
});
