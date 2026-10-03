import { ImageResponse } from "next/og";
import { getPerson, personName } from "@/lib/openCongress";
import { OgFrame, OG_SIZE, ogFonts, truncate } from "@/lib/og";

export const alt = "Lawmaker on CivicSync PH";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const person = await getPerson(params.id).catch(() => null);
  const fonts = await ogFonts();
  const served = person?.congresses_served ?? [];
  const latest = served[0];
  const congresses = new Set(served.map((c) => c.congress_number)).size;

  return new ImageResponse(
    (
      <OgFrame footer="Every bill they’ve authored, in one place.">
        <div style={{ fontSize: 30, color: "#FCA5A5", fontWeight: 600, letterSpacing: 2 }}>RECEIPTS</div>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 72, fontWeight: 700, lineHeight: 1.08, marginTop: 16, maxWidth: 1050 }}>
          {person ? truncate(personName(person), 60) : "Philippine lawmakers"}
        </div>
        {latest && (
          <div style={{ display: "flex", fontSize: 34, color: "#C7D2FE", marginTop: 20 }}>
            {`${latest.position}, ${latest.congress_ordinal} Congress${congresses > 1 ? ` · served in ${congresses} congresses` : ""}`}
          </div>
        )}
      </OgFrame>
    ),
    { ...size, fonts }
  );
}
