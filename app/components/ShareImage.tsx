"use client";

import { useState } from "react";

type Format = "post" | "story";

/**
 * Preview + "share or save" for a generated card image (CS-204). Phones
 * open the share sheet with the image attached (Instagram, Messenger…);
 * elsewhere the image downloads.
 */
export function ShareImagePanel({ src, filename, intro }: { src: string; filename: string; intro: string }) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [error, setError] = useState(false);

  const go = async (format: Format) => {
    setBusy(format);
    setError(false);
    try {
      const res = await fetch(`${src}?format=${format}`);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const file = new File([blob], `${filename}-${format}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = Object.assign(document.createElement("a"), { href: url, download: file.name });
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  const btn = "inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition disabled:opacity-60";
  return (
    <div>
      <p className="text-sm text-gray-600">{intro}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated on demand; next/image adds nothing here */}
      <img src={`${src}?format=post`} alt="Preview of the share image" className="mx-auto mt-3 w-full max-w-[260px] rounded-xl shadow-md ring-1 ring-gray-200" loading="lazy" />
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => go("post")} disabled={!!busy} className={`${btn} bg-navy text-white ring-navy-ink hover:bg-blue-900`}>
          {busy === "post" ? "Preparing…" : "Post (4:5)"}
        </button>
        <button type="button" onClick={() => go("story")} disabled={!!busy} className={`${btn} bg-surface text-navy-ink ring-gray-200 hover:ring-navy-ink/40`}>
          {busy === "story" ? "Preparing…" : "Story (9:16)"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-crimson-ink">Couldn’t make the image right now. Try again in a moment.</p>}
      <p className="mt-2 text-[11px] text-gray-500">On phones this opens your share menu. On computers the image downloads.</p>
    </div>
  );
}

/** Small toggle button that reveals the share-image panel (used on lawmaker pages). */
export function ShareImageButton(props: { src: string; filename: string; intro: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-navy-ink hover:bg-navy-ink/5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="m4 16 4-4 4 4 3-3 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {open ? "Hide share image" : "Share as image"}
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-surface p-4 ring-1 ring-gray-200/70">
          <ShareImagePanel {...props} />
        </div>
      )}
    </div>
  );
}
