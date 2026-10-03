"use client";

import { useState } from "react";
import { Spinner } from "./SearchNavigation";

type Format = "post" | "story";
const FORMATS: { value: Format; label: string; ratio: string; aspect: string }[] = [
  { value: "post", label: "Post", ratio: "4:5", aspect: "aspect-[4/5]" },
  { value: "story", label: "Story", ratio: "9:16", aspect: "aspect-[9/16]" },
];

/**
 * Preview both sizes, pick one, then share or save it (CS-204). Phones open
 * the share sheet with the image attached (Instagram, Messenger…); elsewhere
 * the image downloads. Images are generated on demand, so each preview and
 * the button show a spinner until they're ready.
 */
export function ShareImagePanel({ src, filename, intro }: { src: string; filename: string; intro: string }) {
  const [format, setFormat] = useState<Format>("post");
  const [loaded, setLoaded] = useState<Record<Format, boolean>>({ post: false, story: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const go = async () => {
    setBusy(true);
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
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600">{intro}</p>
      <div role="radiogroup" aria-label="Image size" className="mt-3 flex items-end justify-center gap-3">
        {FORMATS.map((f) => {
          const selected = format === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setFormat(f.value)}
              className={`group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition ${selected ? "bg-navy-ink/10" : "hover:bg-gray-100"}`}
            >
              <span
                className={`relative block overflow-hidden rounded-lg bg-gray-100 ring-2 ${f.aspect} ${f.value === "post" ? "w-36" : "w-[101px]"} ${
                  selected ? "ring-navy-ink" : "ring-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- generated on demand */}
                <img
                  src={`${src}?format=${f.value}`}
                  alt={`${f.label} preview`}
                  onLoad={() => setLoaded((l) => ({ ...l, [f.value]: true }))}
                  className={`h-full w-full object-cover transition-opacity duration-300 ${loaded[f.value] ? "opacity-100" : "opacity-0"}`}
                />
                {!loaded[f.value] && (
                  <span className="absolute inset-0 grid place-items-center" aria-label="Generating preview">
                    <Spinner className="h-5 w-5 text-gray-500" />
                  </span>
                )}
              </span>
              <span className={`text-xs font-semibold ${selected ? "text-navy-ink" : "text-gray-600"}`}>
                {f.label} <span className="font-normal text-gray-500">{f.ratio}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        aria-busy={busy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:opacity-80"
      >
        {busy && <Spinner className="h-4 w-4 text-white" />}
        {busy ? "Preparing image…" : `Share or save ${format === "post" ? "post" : "story"}`}
      </button>
      {error && <p className="mt-2 text-xs text-crimson-ink">Couldn’t make the image right now. Try again in a moment.</p>}
      <p className="mt-2 text-[11px] text-gray-500">On phones this opens your share menu. On computers the image downloads.</p>
    </div>
  );
}

/** Small toggle button that reveals the share-image panel (used on lawmaker pages). */
export function ShareImageButton(props: { src: string; filename: string; intro: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 print:hidden">
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
