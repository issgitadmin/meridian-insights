"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Link2, Share2, X } from "lucide-react";
import type { Deal } from "@/lib/deals";

export function ShareButton({ name, deals }: { name: string; deals: Deal[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-ink-950 transition hover:bg-white"
      >
        <Share2 className="h-4 w-4" aria-hidden="true" />
        Share
      </button>
      {open && <ShareDialog defaultName={name} deals={deals} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareDialog({ defaultName, deals, onClose }: { defaultName: string; deals: Deal[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(defaultName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, deals }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create the link.");
      return;
    }
    setUrl(`${window.location.origin}${data.path}`);
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      className="w-[calc(100%-2rem)] max-w-lg rounded-4xl border border-ink-700 bg-ink-850 p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Share these insights</h2>
            <p className="mt-1 text-sm text-fg-subtle">
              Saves a snapshot of all {deals.length.toLocaleString()} deals and creates a link. Anyone with the link and the
              team password can view it.
            </p>
          </div>
          <button
            onClick={() => dialog.current?.close()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-fg-subtle hover:bg-ink-700 hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {url ? <CopyLink url={url} /> : (
          <form onSubmit={create} className="mt-6">
            <label htmlFor="snapshot-name" className="text-sm text-fg-muted">
              Snapshot name
            </label>
            <input
              id="snapshot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="mt-2 h-11 w-full rounded-full border border-ink-700 bg-ink-800 px-5 text-sm outline-none focus:border-fg-subtle"
            />
            {error && (
              <p role="alert" className="mt-3 text-sm text-bad">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-fg font-medium text-ink-950 transition hover:bg-white disabled:opacity-60"
            >
              <Link2 className="h-4 w-4" aria-hidden="true" />
              {busy ? "Creating link…" : "Create share link"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the field is selectable as a fallback.
    }
  }
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 rounded-full border border-ink-700 bg-ink-800 p-1.5 pl-5">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="min-w-0 flex-1 bg-transparent text-sm text-fg-muted outline-none"
          aria-label="Share link"
        />
        <button
          onClick={copy}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-fg px-4 text-sm font-medium text-ink-950"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent hover:underline">
        Open the shared view
      </a>
    </div>
  );
}
