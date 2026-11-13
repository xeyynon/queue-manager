import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { getDb } from "@/db/client";
import { rangeSchema, uuidSchema } from "@/lib/validation";
import { getSessionUser } from "@/server/auth";
import { listQueues } from "@/server/queue-service";
import { Dashboard } from "./Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ queue?: string; range?: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const sp = await searchParams;
  const queues = await listQueues(getDb(), user.id);
  const queue = sp.queue && uuidSchema.safeParse(sp.queue).success && queues.some((q) => q.id === sp.queue) ? sp.queue : "all";
  const range = rangeSchema.catch("today").parse(sp.range ?? "today");
  return (
    <>
      <AppBar userName={user.name} isDemo={user.isDemo} current="dashboard" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16">
        <Dashboard queues={queues.map((q) => ({ id: q.id, name: q.name }))} initialQueue={queue} initialRange={range} />
      </main>
    </>
  );
}
