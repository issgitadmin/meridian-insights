"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="flex h-10 items-center gap-2 rounded-full border border-ink-700 bg-ink-850 px-4 text-sm text-fg-muted transition hover:text-fg"
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
