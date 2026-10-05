import { ImageResponse } from "next/og";
import { getBillDetailWithFallback } from "@/lib/billDetail";
import { ordinal, toTitleCase } from "@/lib/format";
import { OgFrame, OgStatus, OG_SIZE, ogFonts, truncate } from "@/lib/og";

export const alt = "Bill on CivicSync PH";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 1800;

export default async function Image(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const bill = await getBillDetailWithFallback(params.id).catch(() => null);
  const fonts = await ogFonts();

  if (!bill) {
    return new ImageResponse(
      (
        <OgFrame>
          <div style={{ fontFamily: "Space Grotesk", fontSize: 72, fontWeight: 700 }}>Philippine bills, easier to follow.</div>
        </OgFrame>
      ),
      { ...size, fonts }
    );
  }

  const title = truncate(toTitleCase(bill.title), 100);
  return new ImageResponse(
    (
      <OgFrame footer="See where this bill is now, and who wrote it.">
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 28, color: "#C7D2FE" }}>
          <span style={{ background: "rgba(255,255,255,0.14)", color: "white", fontWeight: 600, padding: "6px 16px", borderRadius: 10 }}>
            {bill.label}
          </span>
          <span>{`${bill.chamber} · ${ordinal(bill.congress)} Congress`}</span>
        </div>
        <div
          style={{
            fontFamily: "Space Grotesk",
            fontSize: title.length > 70 ? 52 : 68,
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: 24,
            maxWidth: 1050,
          }}
        >
          {title}
        </div>
        {bill.status && (
          <div style={{ display: "flex", marginTop: 32 }}>
            <OgStatus status={bill.status} />
          </div>
        )}
      </OgFrame>
    ),
    { ...size, fonts }
  );
}
