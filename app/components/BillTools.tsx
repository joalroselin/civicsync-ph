"use client";

import { useEffect, useState } from "react";
import { citations, type CiteInput } from "@/lib/cite";
import { ShareImagePanel } from "./ShareImage";

type Panel = "cite" | "embed" | "image" | null;

/** "Cite" and "Embed" on the bill page: copy-paste text for students, researchers, newsrooms and bloggers. */
export function BillTools({ bill, id, siteUrl }: { bill: CiteInput; id: string; siteUrl: string }) {
  const [open, setOpen] = useState<Panel>(null);
  const toggle = (p: Panel) => setOpen((o) => (o === p ? null : p));

  return (
    <div className="mt-4 text-center">
      <div className="inline-flex flex-wrap justify-center gap-1">
        <ToolButton active={open === "cite"} onClick={() => toggle("cite")} label="Cite this bill">
          <path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6" strokeLinecap="round" strokeLinejoin="round" />
        </ToolButton>
        <ToolButton active={open === "embed"} onClick={() => toggle("embed")} label="Embed this bill">
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </ToolButton>
        <ToolButton active={open === "image"} onClick={() => toggle("image")} label="Share as image">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="m4 16 4-4 4 4 3-3 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </ToolButton>
      </div>
      {open && (
        <div className="mx-auto mt-3 max-w-xl rounded-2xl bg-surface p-4 text-left shadow-sm ring-1 ring-gray-200/70">
          {open === "cite" ? (
            <CitePanel bill={bill} />
          ) : open === "embed" ? (
            <EmbedPanel id={id} label={bill.label} siteUrl={siteUrl} />
          ) : (
            <ShareImagePanel
              src={`/bills/${id}/card`}
              filename={`civicsync-${bill.label.replace(/\s+/g, "").toLowerCase()}`}
              intro="An image of this bill’s status and summary for Instagram, Facebook or group chats."
            />
          )}
        </div>
      )}
    </div>
  );
}

function ToolButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-navy-ink hover:bg-navy-ink/5 ${active ? "bg-navy-ink/5" : ""}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        {children}
      </svg>
      {label}
    </button>
  );
}

function CitePanel({ bill }: { bill: CiteInput }) {
  // Today's date for "Accessed", set after mount so server and client markup match.
  const [accessed, setAccessed] = useState("");
  useEffect(() => setAccessed(new Date().toLocaleDateString("en-CA")), []);
  if (!accessed) return null;
  return (
    <>
      <p className="text-sm text-gray-600">
        For essays, research and articles. Links go to the official record. Check your school’s or publication’s style guide before submitting.
      </p>
      {citations(bill, accessed).map((c) => (
        <Snippet key={c.key} name={c.name} code={c.text} wrap={c.key !== "bibtex"} />
      ))}
    </>
  );
}

function EmbedPanel({ id, label, siteUrl }: { id: string; label: string; siteUrl: string }) {
  const page = `${siteUrl}/bills/${id}`;
  return (
    <>
      <p className="text-sm text-gray-600">Show this bill’s live status on your site. It updates on its own as the bill moves.</p>
      <iframe src={`/embed/bill/${id}`} title={`${label} status preview`} className="mt-3 h-[190px] w-full border-0" loading="lazy" />
      <Snippet
        name="Live card"
        hint="Websites and blogs. Add ?theme=dark for dark sites"
        code={`<iframe src="${siteUrl}/embed/bill/${id}" title="${label} status · CivicSync PH" width="100%" height="190" style="border:0;max-width:560px" loading="lazy"></iframe>`}
      />
      <Snippet
        name="Status badge"
        hint="GitHub, Notion, Medium, email newsletters"
        code={`[![${label} status](${siteUrl}/embed/bill/${id}/badge.svg)](${page}?utm_source=embed&utm_medium=badge&utm_campaign=bill-embed)`}
      />
    </>
  );
}

function Snippet({ name, hint, code, wrap = false }: { name: string; hint?: string; code: string; wrap?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold">
          {name} {hint && <span className="font-normal text-gray-500">· {hint}</span>}
        </p>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }}
          className="shrink-0 text-xs font-semibold text-crimson-ink"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={`mt-1.5 rounded-lg bg-gray-50 p-2.5 text-[11px] leading-relaxed text-gray-700 ring-1 ring-gray-200 ${
          wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto"
        }`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
