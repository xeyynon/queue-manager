"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup";

export function LoginForm({ demo }: { demo: { email: string; password: string } | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (mode === "signup" && name.trim() === "") return setError("Enter your name.");
    if (mode === "signup" && password.length < 8) return setError("Use at least 8 characters for the password.");
    setBusy(true);
    const res =
      mode === "signin"
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ email: email.trim(), password, name: name.trim() });
    if (res.error) {
      setBusy(false);
      setError(friendly(res.error.code, res.error.message, mode));
      return;
    }
    router.replace("/queues");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-1" role="group" aria-label="Choose">
        {(
          [
            ["signin", "Sign in"],
            ["signup", "Create account"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className="h-9 rounded-sm text-sm font-medium text-ink-2 aria-pressed:bg-surface aria-pressed:text-ink pointer-coarse:h-11"
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <h2 className="text-xl font-semibold text-ink">{mode === "signin" ? "Sign in to your queues" : "Create a manager account"}</h2>
        {mode === "signup" ? (
          <TextField label="Your name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        ) : null}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? (
          <p role="alert" className="text-sm font-medium text-danger-ink">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primary" size="lg" busy={busy} className="mt-1 w-full">
          {busy ? (mode === "signin" ? "Signing in…" : "Creating account…") : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      {demo ? (
        <div className="mt-8 text-sm text-ink-2">
          <p>
            Evaluating? A demo account has sample queues and 30 days of <strong className="font-semibold text-ink">sample data</strong>.
          </p>
          <button
            type="button"
            className="mt-2 font-medium text-accent underline hover:text-accent-hover"
            onClick={() => {
              setMode("signin");
              setEmail(demo.email);
              setPassword(demo.password);
              setError(null);
            }}
          >
            Fill in the demo login
          </button>
        </div>
      ) : null}
    </div>
  );
}

function friendly(code: string | undefined, message: string | undefined, mode: Mode): string {
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match an account.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Sign in instead.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters for the password.";
    default:
      if (message) return message;
      return mode === "signin" ? "Couldn't sign in. Please try again." : "Couldn't create the account. Please try again.";
  }
}
