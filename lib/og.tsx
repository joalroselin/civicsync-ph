import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Shared pieces for link-preview (Open Graph) images. 1200×630 is the standard size. */
export const OG_SIZE = { width: 1200, height: 630 };
export const SITE_HOST = "civicsync-ph-gamma.vercel.app";

let fontCache: Promise<{ name: string; data: Buffer; weight: 400 | 600 | 700; style: "normal" }[]> | null = null;

/** Fonts live in assets/fonts (SIL OFL). Included in the server bundle via next.config. */
export function ogFonts() {
  fontCache ??= (async () => {
    const dir = join(process.cwd(), "assets", "fonts");
    const [grotesk, inter, interSemi] = await Promise.all([
      readFile(join(dir, "SpaceGrotesk-Bold.ttf")),
      readFile(join(dir, "Inter-Regular.ttf")),
      readFile(join(dir, "Inter-SemiBold.ttf")),
    ]);
    return [
      { name: "Space Grotesk", data: grotesk, weight: 700 as const, style: "normal" as const },
      { name: "Inter", data: inter, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: interSemi, weight: 600 as const, style: "normal" as const },
    ];
  })();
  return fontCache;
}

export function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

function Logo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="8" fill="white" />
      <path d="M9 11h14M9 16h14M9 21h9" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="23" cy="21" r="3" fill="#991B1B" />
    </svg>
  );
}

/** Navy card with brand header and footer; children fill the middle. */
export function OgFrame({ children, footer }: { children: React.ReactNode; footer?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "56px 72px",
        background: "linear-gradient(135deg, #2747A6 0%, #1E3A8A 45%, #152A66 100%)",
        color: "white",
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Logo />
        <span style={{ fontFamily: "Space Grotesk", fontSize: 34, fontWeight: 700 }}>CivicSync PH</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: "#C7D2FE" }}>
        <span>{footer ?? "Check the receipts. Free, no sign-up."}</span>
        <span style={{ fontWeight: 600, color: "white" }}>{SITE_HOST}</span>
      </div>
    </div>
  );
}

/** Status pill using the same tone buckets as the app. */
export function OgStatus({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone = /(republic act|approved by the president|lapsed into law|enacted)/.test(s)
    ? { bg: "#ECFDF5", fg: "#065F46" }
    : /(vetoed|withdrawn|archived|consolidated|substituted)/.test(s)
      ? { bg: "#FEF2F2", fg: "#991B1B" }
      : /(committee|first reading|referred)/.test(s)
        ? { bg: "#FFFBEB", fg: "#92400E" }
        : { bg: "#EEF2FF", fg: "#1E3A8A" };
  const label = status === status.toUpperCase() ? status.charAt(0) + status.slice(1).toLowerCase() : status;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: tone.bg, color: tone.fg, borderRadius: 999, padding: "10px 24px", fontSize: 28, fontWeight: 600 }}>
      <div style={{ width: 12, height: 12, borderRadius: 999, background: tone.fg }} />
      {truncate(label.replace(/\s*\(.*\)\s*$/, ""), 48)}
    </div>
  );
}
