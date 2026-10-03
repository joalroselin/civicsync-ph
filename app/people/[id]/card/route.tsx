import { ImageResponse } from "next/og";
import { getPerson, personName } from "@/lib/openCongress";
import { SHARE_SIZES, ShareFrame, ogFonts, shareFormat, truncate } from "@/lib/og";
import { withProfiles } from "@/lib/authorIndex";
import { getLawmakerRecord } from "@/lib/people";
import { ordinal } from "@/lib/format";

/** Share image for a lawmaker: /people/[id]/card?format=post|story (CS-204). Facts only. */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const format = shareFormat(new URL(req.url).searchParams.get("format"));
  const story = format === "story";
  const [person, fonts] = await Promise.all([
    getPerson(id)
      .then((p) => withProfiles([p]).then(([x]) => x))
      .catch(() => null),
    ogFonts(),
  ]);
  if (!person) return new Response("Lawmaker not found", { status: 404 });
  const record = await getLawmakerRecord(person);

  const served = person.congresses_served ?? [];
  const latest = served[0];
  const congresses = new Set(served.map((c) => c.congress_number)).size;
  const fmt = (n: number | null | undefined) => (n == null ? "–" : n.toLocaleString());

  const stats: { value: string; label: string; accent?: boolean }[] = [
    { value: String(congresses || "–"), label: congresses === 1 ? "congress served" : "congresses served" },
    { value: fmt(record.totalOnRecord), label: "bills on record" },
    ...(record.current
      ? [
          { value: fmt(record.current.filed), label: "filed this Congress" },
          { value: fmt(record.current.becameLaw.length), label: "became law this Congress", accent: record.current.becameLaw.length > 0 },
        ]
      : []),
  ];
  // Oldest → newest, left to right; only worth showing with a few congresses.
  const bars = [...record.byCongress].reverse();
  const max = Math.max(1, ...bars.map((b) => b.bills ?? 0));

  return new ImageResponse(
    (
      <ShareFrame format={format} path="" hint={`Search “${(person.last_name ?? personName(person)).split("-")[0]}” on`}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {person.profile?.portraitUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- rendered by next/og, not the browser
            <img
              src={person.profile.portraitUrl}
              width={story ? 180 : 140}
              height={story ? 180 : 140}
              style={{ borderRadius: 999, objectFit: "cover", objectPosition: "top", border: "4px solid rgba(255,255,255,0.25)" }}
              alt=""
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 26, color: "#FCA5A5", fontWeight: 600, letterSpacing: 3 }}>RECEIPTS</div>
            <div style={{ fontFamily: "Space Grotesk", fontSize: personName(person).length > 28 ? 58 : 70, fontWeight: 700, lineHeight: 1.05, marginTop: 10 }}>
              {truncate(personName(person), 48)}
            </div>
            {latest && (
              <div style={{ display: "flex", fontSize: 28, color: "#C7D2FE", marginTop: 12 }}>
                {`${person.profile?.position ?? latest.position}, ${latest.congress_ordinal} Congress${person.profile?.representation ? ` · ${person.profile.representation}` : ""}`}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 48 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", width: 450, padding: "24px 30px", borderRadius: 24, background: "rgba(255,255,255,0.08)" }}>
              <span style={{ fontFamily: "Space Grotesk", fontSize: 64, fontWeight: 700, color: s.accent ? "#6EE7B7" : "white" }}>{s.value}</span>
              <span style={{ fontSize: 24, color: "#C7D2FE" }}>{s.label}</span>
            </div>
          ))}
        </div>

        {bars.length >= 3 && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
            <span style={{ fontSize: 22, color: "#C7D2FE", marginBottom: 12 }}>Bills filed per congress</span>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: story ? 160 : 110 }}>
              {bars.map((b) => (
                <div key={b.congress} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 6 }}>
                  <span style={{ fontSize: 18, color: "#E0E7FF" }}>{fmt(b.bills)}</span>
                  <div
                    style={{
                      width: "100%",
                      height: Math.max(4, ((b.bills ?? 0) / max) * (story ? 110 : 64)),
                      borderRadius: 6,
                      background: b.congress === 20 ? "#FCA5A5" : "rgba(255,255,255,0.55)",
                    }}
                  />
                  <span style={{ fontSize: 18, color: "#C7D2FE" }}>{ordinal(b.congress)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", fontSize: 20, color: "#A5B4FC", marginTop: 28 }}>
          {record.current ? "Laws: 20th Congress so far, incl. co-authored. " : ""}Earlier bills from Open Congress (1987 to about Sept 2025).
        </div>
      </ShareFrame>
    ),
    { ...SHARE_SIZES[format], fonts, headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
