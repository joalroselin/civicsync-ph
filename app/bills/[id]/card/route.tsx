import { ImageResponse } from "next/og";
import { getBillDetailWithFallback } from "@/lib/billDetail";
import { explainStatus, STAGES } from "@/lib/billStages";
import { personShortName } from "@/lib/openCongress";
import { ordinal, toTitleCase } from "@/lib/format";
import { OgStatus, SHARE_SIZES, ShareFrame, ShareProgress, ogFonts, shareFormat, truncate } from "@/lib/og";

/** Share image for a bill: /bills/SBN-1294/card?format=post|story (CS-204). */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const format = shareFormat(new URL(req.url).searchParams.get("format"));
  const story = format === "story";
  const [bill, fonts] = await Promise.all([getBillDetailWithFallback(id).catch(() => null), ogFonts()]);
  if (!bill) return new Response("Bill not found", { status: 404 });

  const title = truncate(toTitleCase(bill.title), story ? 130 : 110);
  const names = bill.authors.length ? bill.authors.map(personShortName) : bill.authorNames;
  const byline = names.length ? `Filed by ${bill.chamber === "Senate" ? "Sen." : "Rep."} ${names[0]}${names.length > 1 ? ` and ${names.length - 1} more` : ""}` : null;
  const help = explainStatus(bill.status);
  const summary = bill.analysis?.overview ? truncate(bill.analysis.overview, story ? 300 : 210) : null;

  return new ImageResponse(
    (
      <ShareFrame format={format} path={`/bills/${bill.id}`}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 28, color: "#C7D2FE" }}>
          <span style={{ background: "rgba(255,255,255,0.14)", color: "white", fontWeight: 600, padding: "6px 18px", borderRadius: 12 }}>{bill.label}</span>
          <span>{`${bill.chamber} · ${ordinal(bill.congress)} Congress`}</span>
        </div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: title.length > 80 ? 56 : 68, fontWeight: 700, lineHeight: 1.08, marginTop: 28 }}>{title}</div>
        {byline && <div style={{ display: "flex", fontSize: 28, color: "#C7D2FE", marginTop: 20 }}>{byline}</div>}
        {summary && (
          <div style={{ display: "flex", fontSize: 30, lineHeight: 1.4, marginTop: 40, padding: "28px 32px", borderRadius: 24, background: "rgba(255,255,255,0.08)" }}>
            {summary}
          </div>
        )}
        {bill.status && (
          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 44 }}>
            <div style={{ display: "flex" }}>
              <OgStatus status={bill.status} />
            </div>
            {help?.stage != null && <ShareProgress stage={help.stage} labels={STAGES.map((s) => s.short)} />}
          </div>
        )}
      </ShareFrame>
    ),
    { ...SHARE_SIZES[format], fonts, headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } }
  );
}
