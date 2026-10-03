"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard blocked (e.g. insecure context) — the text is still selectable.
        }
      }}
      className="rounded-lg px-2 py-1 text-xs font-semibold text-navy-ink hover:bg-navy-ink/5"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
