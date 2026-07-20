import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Axon — Study smarter, stay consistent";

export default function OpengraphImage() {
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
          backgroundColor: "#08090c",
          backgroundImage:
            "radial-gradient(circle at 22% 20%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 80% 75%, rgba(168,85,247,0.28), transparent 50%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 108,
            height: 108,
            borderRadius: 26,
            background: "#3b82f6",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
            boxShadow: "0 20px 60px -16px rgba(59,130,246,0.6)",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <path d="M18 6L10 18h6l-2 8 10-14h-6l2-6z" fill="#eaf1ff" />
          </svg>
        </div>
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
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 30,
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
