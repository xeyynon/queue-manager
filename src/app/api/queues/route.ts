import { z } from "zod";
import { queueNameSchema } from "@/lib/validation";
import { createQueue, listQueues } from "@/server/queue-service";
import { json, readJson, withUser } from "@/server/http";

export const GET = withUser(async ({ user, db }) => json({ queues: await listQueues(db, user.id) }));

export const POST = withUser(async ({ req, user, db }) => {
  const { name } = z.object({ name: queueNameSchema }).parse(await readJson(req));
  return json({ queue: await createQueue(db, user.id, name) }, 201);
});
