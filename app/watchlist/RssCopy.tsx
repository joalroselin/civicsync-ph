"use client";

import { useState } from "react";

/** Copies a personal RSS link for the bills on this device's Watchlist (CS-113). */
export function RssCopy({ bills }: { bills: string[] }) {
  const [copied, setCopied] = useState(false);
  const ids = bills.filter((b) => /^(SBN-\d+|HB\d+)$/.test(b));
  if (!ids.length) return null;
  const url = `${location.origin}/feeds/watchlist?b=${ids.join(",")}`;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-gray-900">Follow in a news reader</p>
        <p className="text-xs text-gray-600">A personal RSS link with these bills, for Feedly, Inoreader, Slack or email via Zapier. Add new bills later? Copy it again.</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="shrink-0 rounded-xl bg-surface px-3.5 py-2 text-sm font-semibold text-navy-ink ring-1 ring-gray-200 hover:ring-navy-ink/40"
      >
        {copied ? "Copied" : "Copy RSS link"}
      </button>
    </div>
  );
}
