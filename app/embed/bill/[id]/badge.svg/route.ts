import { EMBED_CACHE, TONE_COLORS, esc, loadEmbedBill } from "@/lib/embed";

/**
 * Status badge image for places that don't allow iframes (GitHub READMEs,
 * Medium, Notion, email newsletters): "SB 1294 | Pending in committee".
 */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const bill = await loadEmbedBill(params.id);
  const left = bill?.label ?? "Bill";
  const right = bill ? (bill.status.length > 48 ? `${bill.status.slice(0, 47)}…` : bill.status) : "unavailable";
  const tone = TONE_COLORS[bill?.tone ?? "unknown"];
  // Rough text width for an 11px sans-serif font; good enough for a badge.
  const w = (s: string) => Math.round(s.length * 6.4) + 20;
  const lw = w(left), rw = w(right);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${lw + rw}" height="22" role="img" aria-label="${esc(`${left}: ${right}`)}">
<title>${esc(`${left}: ${right} · CivicSync PH`)}</title>
<rect width="${lw}" height="22" rx="4" fill="#1E3A8A"/><rect x="${lw - 4}" width="${rw + 4}" height="22" rx="4" fill="${tone.bg}"/>
<rect x="${lw - 4}" width="4" height="22" fill="${tone.bg}"/>
<g font-family="Verdana,DejaVu Sans,sans-serif" font-size="11" font-weight="600">
<text x="${lw / 2}" y="15" fill="#fff" text-anchor="middle">${esc(left)}</text>
<text x="${lw + rw / 2}" y="15" fill="${tone.fg}" text-anchor="middle">${esc(right)}</text>
</g></svg>`;
  return new Response(svg, {
    status: bill ? 200 : 404,
    headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": EMBED_CACHE },
  });
}
