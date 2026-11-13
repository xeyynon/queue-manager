import { z } from "zod";
import { queueNameSchema } from "@/lib/validation";
import { deleteQueue, getQueueState, renameQueue } from "@/server/queue-service";
import { json, parseId, readJson, withUser } from "@/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withUser<Ctx>(async ({ user, db, route }) => {
  const id = parseId((await route.params).id);
  return json(await getQueueState(db, user.id, id));
});

export const PATCH = withUser<Ctx>(async ({ req, user, db, route }) => {
  const id = parseId((await route.params).id);
  const { name } = z.object({ name: queueNameSchema }).parse(await readJson(req));
  await renameQueue(db, user.id, id, name);
  return json({ ok: true });
});

export const DELETE = withUser<Ctx>(async ({ user, db, route }) => {
  const id = parseId((await route.params).id);
  await deleteQueue(db, user.id, id);
  return json({ ok: true });
});
