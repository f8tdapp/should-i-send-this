import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#7487b8",
          color: "#0f172a",
          padding: "72px",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "48px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "24px",
                background: "#0f172a",
                color: "#fff2d8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "38px",
                fontWeight: 900,
              }}
            >
              T
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "54px",
                fontWeight: 900,
                letterSpacing: "-2px",
              }}
            >
              <span>Text</span>
              <span style={{ color: "#2f6fed" }}>Panic</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: "78px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-2.5px",
              }}
            >
              <span>Paste your text.</span>
              <span>We’ll tell you what people hear.</span>
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.35,
                color: "#334155",
              }}
            >
              For messages written during emotional turbulence.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "24px",
            fontWeight: 700,
            color: "#334155",
          }}
        >
          <div>The outside read before you hit send.</div>
          <div>textpanic.com</div>
        </div>
      </div>
    ),
    size,
  );
}
