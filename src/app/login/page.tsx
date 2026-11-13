import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await getSessionUser()) redirect("/queues");
  const { expired } = await searchParams;
  const demo =
    process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD
      ? { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD }
      : null;

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 content-center gap-10 px-4 py-12 md:grid-cols-[1fr_400px] md:gap-16">
      <section className="max-w-md self-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Queue Manager</h1>
        <p className="mt-4 text-lg text-ink-2">
          Issue tokens, keep the line in order and call the next person with one click.
        </p>
        <ul className="mt-6 space-y-2 text-ink-2">
          <li>Everyone in line sees their position and an estimated wait.</li>
          <li>Every reorder is logged, so moving someone up is never a mystery.</li>
          <li>A dashboard shows wait times and how busy each hour was.</li>
        </ul>
      </section>
      <section aria-label="Sign in or create an account" className="w-full max-w-[400px]">
        {expired ? (
          <p role="status" className="mb-4 text-sm text-ink-2">
            Your session ended. Sign in again to continue.
          </p>
        ) : null}
        <LoginForm demo={demo} />
      </section>
    </main>
  );
}
