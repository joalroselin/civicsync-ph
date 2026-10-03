"use client";

import { useState } from "react";

/** "Embed this bill": copy-paste snippets for blogs, newsrooms, READMEs and newsletters. */
export function EmbedPanel({ id, label, siteUrl }: { id: string; label: string; siteUrl: string }) {
  const [open, setOpen] = useState(false);
  const page = `${siteUrl}/bills/${id}`;
  const snippets = [
    {
      key: "card",
      name: "Live card",
      hint: "Websites and blogs. Add ?theme=dark for dark sites",
      code: `<iframe src="${siteUrl}/embed/bill/${id}" title="${label} status · CivicSync PH" width="100%" height="190" style="border:0;max-width:560px" loading="lazy"></iframe>`,
    },
    {
      key: "badge",
      name: "Status badge",
      hint: "GitHub, Notion, Medium, email newsletters",
      code: `[![${label} status](${siteUrl}/embed/bill/${id}/badge.svg)](${page}?utm_source=embed&utm_medium=badge&utm_campaign=bill-embed)`,
    },
  ];

  return (
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-navy hover:bg-navy/5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {open ? "Hide embed code" : "Embed this bill"}
      </button>
      {open && (
        <div className="mx-auto mt-3 max-w-xl rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-200/70">
          <p className="text-sm text-gray-600">Show this bill’s live status on your site. It updates on its own as the bill moves.</p>
          <iframe src={`/embed/bill/${id}`} title={`${label} status preview`} className="mt-3 h-[190px] w-full border-0" loading="lazy" />
          {snippets.map((s) => (
            <Snippet key={s.key} name={s.name} hint={s.hint} code={s.code} />
          ))}
        </div>
      )}
    </div>
  );
}

function Snippet({ name, hint, code }: { name: string; hint: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          {name} <span className="font-normal text-gray-500">· {hint}</span>
        </p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="shrink-0 text-xs font-semibold text-crimson"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-1.5 overflow-x-auto rounded-lg bg-gray-50 p-2.5 text-[11px] leading-relaxed text-gray-700 ring-1 ring-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
