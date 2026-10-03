import { ImageResponse } from "next/og";
import { getPerson, getPersonBills, personName } from "@/lib/openCongress";
import { SHARE_SIZES, ShareFrame, ogFonts, shareFormat, truncate } from "@/lib/og";

/** Share image for a lawmaker: /people/[id]/card?format=post|story (CS-204). Facts only. */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const format = shareFormat(new URL(req.url).searchParams.get("format"));
  const [person, bills, fonts] = await Promise.all([
    getPerson(id).catch(() => null),
    getPersonBills(id, { limit: 1 }).catch(() => null),
    ogFonts(),
  ]);
  if (!person) return new Response("Lawmaker not found", { status: 404 });

  const served = person.congresses_served ?? [];
  const latest = served[0];
  const congresses = new Set(served.map((c) => c.congress_number)).size;

  return new ImageResponse(
    (
      <ShareFrame format={format} path="" hint={`Search “${(person.last_name ?? personName(person)).split("-")[0]}” on`}>
        <div style={{ fontSize: 30, color: "#FCA5A5", fontWeight: 600, letterSpacing: 3 }}>RECEIPTS</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 84, fontWeight: 700, lineHeight: 1.05, marginTop: 20 }}>{truncate(personName(person), 48)}</div>
        {latest && <div style={{ display: "flex", fontSize: 34, color: "#C7D2FE", marginTop: 20 }}>{`${latest.position}, ${latest.congress_ordinal} Congress`}</div>}
        <div style={{ display: "flex", gap: 24, marginTop: 56 }}>
          <Stat value={congresses ? String(congresses) : "–"} label={congresses === 1 ? "congress served" : "congresses served"} />
          <Stat value={bills ? bills.total.toLocaleString() : "–"} label="bills on record" />
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#C7D2FE", marginTop: 40 }}>Bills on record from Open Congress (1987 to about Sept 2025).</div>
      </ShareFrame>
    ),
    { ...SHARE_SIZES[format], fonts, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 32px", borderRadius: 24, background: "rgba(255,255,255,0.08)" }}>
      <span style={{ fontFamily: "Space Grotesk", fontSize: 72, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 26, color: "#C7D2FE" }}>{label}</span>
    </div>
  );
}
