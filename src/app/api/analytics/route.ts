import { rangeSchema } from "@/lib/validation";
import { safeTimeZone } from "@/lib/timezone";
import { getAnalytics } from "@/server/analytics-service";
import { json, parseId, withUser } from "@/server/http";

export const GET = withUser(async ({ req, user, db }) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("queue");
  const range = rangeSchema.catch("today").parse(url.searchParams.get("range") ?? "today");
  const timeZone = safeTimeZone(url.searchParams.get("tz"));
  const queueId = q && q !== "all" ? parseId(q) : null;
  return json(await getAnalytics(db, user.id, { queueId, range, timeZone }));
});
