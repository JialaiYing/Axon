import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Axon — Study smarter, stay consistent";

export default async function OpengraphImage() {
  const logoData = await readFile(join(process.cwd(), "public/axon_icon_only.png"));
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
          }}
        >
          <img src={logoSrc} width={108} height={108} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              color: "#f4f5f7",
            }}
          >
            Axon
          </div>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 28,
            color: "#9096a8",
            maxWidth: 820,
            textAlign: "center",
          }}
        >
          Study smarter, stay consistent.
        </div>
      </div>
    ),
    { ...size }
  );
}
