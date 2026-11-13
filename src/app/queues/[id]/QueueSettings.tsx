"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { api, ApiFailure } from "@/lib/api";
import { QUEUE_NAME_MAX } from "@/lib/validation";

/** Rename or delete the queue. Delete can't be undone, so it is confirmed with its consequence. */
export function QueueSettings({
  queueId,
  name,
  waiting,
  onRenamed,
}: {
  queueId: string;
  name: string;
  waiting: number;
  onRenamed: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"rename" | "delete" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function open() {
    setDraft(name);
    setError(null);
    setConfirmDelete(false);
    dialogRef.current?.showModal();
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy("rename");
    setError(null);
    try {
      await api(`/api/queues/${queueId}`, { method: "PATCH", body: { name: draft } });
      dialogRef.current?.close();
      toast.success("Queue renamed");
      onRenamed();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't rename the queue.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    setBusy("delete");
    try {
      await api(`/api/queues/${queueId}`, { method: "DELETE" });
      toast(`Deleted "${name}"`);
      router.replace("/queues");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiFailure ? err.message : "Couldn't delete the queue.");
      setBusy(null);
    }
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={open}>
        Settings
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="settings-h"
        className="m-auto w-[min(440px,calc(100vw-32px))] rounded-md bg-surface p-5 text-ink backdrop:bg-ink/40"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
      >
        <h2 id="settings-h" className="text-lg font-semibold">
          Queue settings
        </h2>
        <form onSubmit={rename} className="mt-4" noValidate>
          <TextField
            label="Queue name"
            value={draft}
            maxLength={QUEUE_NAME_MAX}
            onChange={(e) => setDraft(e.target.value)}
            error={error}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => dialogRef.current?.close()}>
              Close
            </Button>
            <Button type="submit" variant="primary" busy={busy === "rename"}>
              {busy === "rename" ? "Saving…" : "Save name"}
            </Button>
          </div>
        </form>

        <div className="mt-6 border-t border-line pt-4">
          <h3 className="font-semibold">Delete this queue</h3>
          {!confirmDelete ? (
            <>
              <p className="mt-1 text-sm text-ink-2">Removes the queue, its tokens and its history from the dashboard. This can&rsquo;t be undone.</p>
              <Button variant="danger" className="mt-3 -ml-2" onClick={() => setConfirmDelete(true)}>
                Delete queue…
              </Button>
            </>
          ) : (
            <div role="alert">
              <p className="mt-1 text-sm text-ink">
                Delete <strong>&ldquo;{name}&rdquo;</strong>
                {waiting > 0 ? ` with ${waiting} ${waiting === 1 ? "person" : "people"} still waiting` : ""}? All its history goes too.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)} autoFocus>
                  Keep queue
                </Button>
                <Button variant="danger" busy={busy === "delete"} onClick={remove} className="font-semibold">
                  {busy === "delete" ? "Deleting…" : "Yes, delete it"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
