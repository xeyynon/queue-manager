import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-ink-2">This page or queue doesn&rsquo;t exist, or it belongs to another account.</p>
      <Link href="/queues" className="mt-6 font-medium text-accent underline">
        Back to your queues
      </Link>
    </main>
  );
}
