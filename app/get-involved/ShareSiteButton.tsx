"use client";

import { useState } from "react";

const SHARE = {
  title: "CivicSync PH",
  text: "Look up Philippine lawmakers and the bills they file. Free, no sign-up.",
  url: "https://civicsync-ph-gamma.vercel.app",
};

/** Native share sheet on phones; copies the link elsewhere. */
export function ShareSiteButton({ label, className }: { label: string; className: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        if (navigator.share) {
          await navigator.share(SHARE).catch(() => {});
          return;
        }
        try {
          await navigator.clipboard.writeText(SHARE.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard blocked; nothing else to do
        }
      }}
    >
      {copied ? "Link copied" : label}
    </button>
  );
}
