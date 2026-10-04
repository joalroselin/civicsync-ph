import { ImageResponse } from "next/og";
import { weeklySummary } from "@/lib/weekly";
import { fromBatasWatchNumber } from "@/lib/batasWatch";
import { displayStatus, toTitleCase } from "@/lib/format";
import { SHARE_SIZES, ShareFrame, ogFonts, shareFormat, truncate } from "@/lib/og";

/** "This week in Congress" share image: /changes/week/card?format=post|story */
export async function GET(req: Request) {
  const format = shareFormat(new URL(req.url).searchParams.get("format"));
  const story = format === "story";
  const [week, fonts] = await Promise.all([weeklySummary(), ogFonts()]);
  const label = (n: string) => {
    const p = fromBatasWatchNumber(n);
    return p ? `${p.subtype} ${p.number}` : n;
  };
  const pretty = (s: string) => truncate(displayStatus(s), 46);

  return new ImageResponse(
    (
      <ShareFrame format={format} path="/changes">
        <div style={{ fontSize: 28, color: "#FCA5A5", fontWeight: 600, letterSpacing: 3 }}>THIS WEEK IN CONGRESS</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 64, fontWeight: 700, marginTop: 10 }}>{week.range}</div>
        <div style={{ display: "flex", gap: 18, marginTop: 36 }}>
          {[
            [week.filed, "bills filed"],
            [week.moved, "bills moved"],
            [week.laws.length, "became law"],
          ].map(([n, l], i) => (
            <div key={l as string} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 26px", borderRadius: 22, background: "rgba(255,255,255,0.08)" }}>
              <span style={{ fontFamily: "Space Grotesk", fontSize: 64, fontWeight: 700, color: i === 2 && (n as number) > 0 ? "#6EE7B7" : "white" }}>
                {(n as number).toLocaleString()}
              </span>
              <span style={{ fontSize: 24, color: "#C7D2FE" }}>{l}</span>
            </div>
          ))}
        </div>
        {week.highlights.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
            {week.highlights.slice(0, story ? 4 : 3).map((c) => (
              <div key={c.number} style={{ display: "flex", flexDirection: "column", padding: "18px 24px", borderRadius: 20, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#C7D2FE" }}>
                  <span style={{ fontWeight: 600, color: "white" }}>{label(c.number)}</span>
                  <span>{pretty(c.to)}</span>
                </div>
                <span style={{ fontSize: 28, marginTop: 6, lineHeight: 1.25 }}>{truncate(toTitleCase(c.title), 80)}</span>
              </div>
            ))}
          </div>
        )}
      </ShareFrame>
    ),
    { ...SHARE_SIZES[format], fonts, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
