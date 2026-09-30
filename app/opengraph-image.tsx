import { ImageResponse } from "next/og";
import { OgFrame, OG_SIZE, ogFonts } from "@/lib/og";

export const alt = "CivicSync PH: look up Philippine lawmakers and the bills they file";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ fontFamily: "Space Grotesk", fontSize: 84, fontWeight: 700, lineHeight: 1.05, maxWidth: 950 }}>
          Know who wrote the law.
        </div>
        <div style={{ fontSize: 34, color: "#C7D2FE", marginTop: 28, maxWidth: 950, lineHeight: 1.35 }}>
          Look up any Philippine lawmaker and every bill they’ve filed, back to 1987.
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
