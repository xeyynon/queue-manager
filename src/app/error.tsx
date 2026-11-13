"use client";

import { Button } from "@/components/Button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-ink-2">The page couldn&rsquo;t load. This is usually a brief database or network hiccup.</p>
      <Button variant="primary" className="mx-auto mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
