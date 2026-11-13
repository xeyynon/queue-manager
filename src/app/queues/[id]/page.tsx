import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { getDb } from "@/db/client";
import { uuidSchema } from "@/lib/validation";
import { getSessionUser } from "@/server/auth";
import { AppError } from "@/server/errors";
import { getQueueState } from "@/server/queue-service";
import { QueueConsole } from "./QueueConsole";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const user = await getSessionUser();
  const { id } = await params;
  if (!user || !uuidSchema.safeParse(id).success) return { title: "Queue" };
  try {
    const s = await getQueueState(getDb(), user.id, id);
    return { title: s.queue.name };
  } catch {
    return { title: "Queue" };
  }
}

export default async function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const state = await getQueueState(getDb(), user.id, id).catch((err) => {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    throw err;
  });
  return (
    <>
      <AppBar userName={user.name} isDemo={user.isDemo} current="queues" />
      <QueueConsole key={id} initial={state} />
    </>
  );
}
