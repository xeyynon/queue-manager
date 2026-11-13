import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { getDb } from "@/db/client";
import { getSessionUser } from "@/server/auth";
import { listQueues } from "@/server/queue-service";
import { QueueList } from "./QueueList";

export const metadata: Metadata = { title: "Queues" };

export default async function QueuesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const queues = await listQueues(getDb(), user.id);
  return (
    <>
      <AppBar userName={user.name} isDemo={user.isDemo} current="queues" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-16">
        <QueueList initial={queues} serverNow={new Date().toISOString()} />
      </main>
    </>
  );
}
