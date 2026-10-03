import { EMBED_CACHE, TONE_COLORS, esc, loadEmbedBill } from "@/lib/embed";
import { ordinal } from "@/lib/format";
import { withUtm } from "@/lib/site";

/**
 * Embeddable bill status card for blogs, newsrooms and school sites:
 *   <iframe src="https://…/embed/bill/SBN-1294" width="100%" height="190" …>
 * Add ?theme=dark for dark sites.
 * Plain HTML (no app shell, no scripts, no cookies) so it loads fast anywhere.
 */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const bill = await loadEmbedBill(params.id);
  const link = withUtm(`/bills/${params.id}`, "embed", "widget", "bill-embed");
  // Light by default so it matches most host sites; ?theme=dark opts in.
  const dark = new URL(req.url).searchParams.get("theme") === "dark";
  const tone = bill ? TONE_COLORS[bill.tone] : TONE_COLORS.unknown;

  const body = bill
    ? `<div class="meta"><span class="chip">${esc(bill.label)}</span><span>${esc(bill.chamber)} · ${ordinal(bill.congress)} Congress</span></div>
<p class="title">${esc(bill.title)}</p>
<div class="row"><span class="status"><i></i>${esc(bill.status)}</span>${bill.byline ? `<span class="by">${esc(bill.byline)}</span>` : ""}</div>`
    : `<p class="title">This bill couldn’t be loaded right now.</p>`;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${bill ? esc(bill.label) : "Bill"} · CivicSync PH</title>
<style>
*{box-sizing:border-box;margin:0}
body{font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;background:transparent;color:#111827}
a.card{display:flex;flex-direction:column;gap:8px;padding:14px 16px;border:1px solid #E5E7EB;border-radius:14px;background:#fff;color:inherit;text-decoration:none;height:100vh;max-height:200px;overflow:hidden}
a.card:hover{border-color:#1E3A8A55}
.meta{display:flex;gap:8px;align-items:center;font-size:12px;color:#6B7280;flex-wrap:wrap}
.chip{background:#1E3A8A1a;color:#1E3A8A;font-weight:700;border-radius:6px;padding:1px 6px}
.title{font-weight:600;font-size:15px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;color:#4B5563}
.status{display:inline-flex;gap:6px;align-items:center;border-radius:99px;padding:2px 10px;font-weight:600;background:${tone.bg};color:${tone.fg};max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.status i{width:6px;height:6px;border-radius:99px;background:${tone.dot};flex:none}
.foot{margin-top:auto;display:flex;justify-content:space-between;font-size:12px;color:#6B7280}
.foot b{color:#1E3A8A}
${dark ? `body{color:#F3F4F6}a.card{background:#111827;border-color:#374151}.meta,.row,.foot{color:#9CA3AF}.chip{background:#93C5FD26;color:#BFDBFE}.foot b{color:#BFDBFE}` : ""}
</style></head><body>
<a class="card" href="${esc(link)}" target="_blank" rel="noopener">
${body}
<div class="foot"><span>Live status · updates automatically</span><b>CivicSync PH →</b></div>
</a></body></html>`;

  return new Response(html, {
    status: bill ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": EMBED_CACHE },
  });
}
