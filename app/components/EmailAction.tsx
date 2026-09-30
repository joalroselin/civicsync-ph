"use client";

import { useState } from "react";

/**
 * An email call-to-action that works without a desktop mail app.
 * `mailto:` links do nothing for many people who use webmail, so this opens a
 * small panel with the address, Gmail compose, "other email app", and copy
 * buttons for the address and (optionally) a message template.
 */
export function EmailAction({
  email,
  subject,
  body,
  label,
  buttonClassName,
  align = "left",
}: {
  email: string;
  subject: string;
  body?: string;
  label: string;
  buttonClassName: string;
  align?: "left" | "center";
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const q = (s: string) => encodeURIComponent(s);
  const mailto = `mailto:${email}?subject=${q(subject)}${body ? `&body=${q(body)}` : ""}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${q(email)}&su=${q(subject)}${body ? `&body=${q(body)}` : ""}`;

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied("Copy failed. Select the text instead.");
    }
  };

  const small =
    "inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-200 bg-white text-gray-800 hover:ring-gray-300";

  return (
    <div className={align === "center" ? "flex flex-col items-center" : ""}>
      <button type="button" className={buttonClassName} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label}
      </button>

      {open && (
        <div className={`mt-3 w-full max-w-sm rounded-xl bg-gray-50 p-3 text-left text-sm ring-1 ring-gray-200 ${align === "center" ? "mx-auto" : ""}`}>
          <p className="text-xs text-gray-500">Email</p>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-semibold text-gray-900">{email}</span>
            <button type="button" className="shrink-0 text-xs font-semibold text-navy hover:underline" onClick={() => copy(email, "Email copied")}>
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">Subject</p>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-gray-800">{subject}</span>
            <button type="button" className="shrink-0 text-xs font-semibold text-navy hover:underline" onClick={() => copy(subject, "Subject copied")}>
              Copy
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <a href={gmail} target="_blank" rel="noreferrer" className={small}>
              Open in Gmail
            </a>
            <a href={mailto} className={small}>
              Other email app
            </a>
            {body && (
              <button type="button" className={small} onClick={() => copy(body, "Template copied")}>
                Copy message template
              </button>
            )}
          </div>
          {body && <p className="mt-2 text-xs text-gray-500">The template is also filled in when you open Gmail or your email app.</p>}
          {copied && (
            <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">
              {copied}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
