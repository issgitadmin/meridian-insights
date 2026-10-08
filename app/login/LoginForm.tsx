"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock } from "lucide-react";
import { Logo } from "@/components/Logo";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    router.replace(data.next ?? "/upload");
    router.refresh();
  }

  const sharing = next?.startsWith("/share/");

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-fg text-ink-950">
          <Logo className="h-5 w-5" />
        </span>
        <span className="text-lg font-semibold tracking-wide">MERIDIAN</span>
      </div>

      <form onSubmit={submit} className="rounded-4xl border border-ink-700/70 bg-ink-850 p-7 sm:p-8">
        <div className="mb-6 grid h-11 w-11 place-items-center rounded-full border border-ink-700 bg-ink-800 text-fg-muted">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-medium tracking-tight">{sharing ? "Open shared insights" : "Welcome back"}</h1>
        <p className="mt-1.5 text-sm text-fg-subtle">
          {sharing
            ? "Someone shared a Meridian snapshot with you. Enter the team password to view it."
            : "Enter the team password to access sales insights."}
        </p>

        <label htmlFor="password" className="mt-7 block text-sm text-fg-muted">
          Password
        </label>
        <div
          className={`mt-2 flex items-center rounded-full border bg-ink-800 pl-5 pr-1.5 transition focus-within:border-fg-subtle ${
            error ? "border-bad/60" : "border-ink-700"
          }`}
        >
          <input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className="h-12 min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-fg-subtle"
            placeholder="••••••"
            aria-invalid={!!error}
            aria-describedby={error ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="grid h-9 w-9 place-items-center rounded-full text-fg-subtle hover:text-fg"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p id="password-error" role="alert" className="mt-2 pl-5 text-sm text-bad">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !password}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-fg font-medium text-ink-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Checking…" : "Continue"}
          {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>
    </div>
  );
}
