import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function LayeredLineMark({
  size,
  radius,
  dotSize,
  dotOffset,
}: {
  size: number;
  radius: number;
  dotSize: number;
  dotOffset: number;
}) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        background: "#172033",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${Math.max(5, size * 0.09)}px`,
          width: `${size * 0.5}px`,
        }}
      >
        <div
          style={{
            width: `${size * 0.46}px`,
            height: `${size * 0.075}px`,
            borderRadius: "999px",
            background: "#FFFDF8",
          }}
        />
        <div
          style={{
            marginLeft: `${size * 0.15}px`,
            width: `${size * 0.36}px`,
            height: `${size * 0.075}px`,
            borderRadius: "999px",
            background: "rgba(255,253,248,0.88)",
          }}
        />
        <div
          style={{
            width: `${size * 0.27}px`,
            height: `${size * 0.075}px`,
            borderRadius: "999px",
            background: "rgba(255,253,248,0.72)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: `${dotOffset}px`,
          top: `${dotOffset}px`,
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: "999px",
          border: "4px solid #F4F1EA",
          background: "#64748B",
        }}
      />
    </div>
  );
}

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
          background: "#F4F1EA",
          color: "#111827",
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
            <LayeredLineMark size={68} radius={24} dotSize={16} dotOffset={-2} />
            <div
              style={{
                display: "flex",
                fontSize: "54px",
                fontWeight: 900,
                letterSpacing: "-1.8px",
              }}
            >
              <span>BetweenLines</span>
              <span style={{ color: "#64748B", marginLeft: "12px" }}>AI</span>
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
                fontSize: "76px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-2.5px",
              }}
            >
              <span>See the gap between</span>
              <span>what you mean and what others may hear.</span>
            </div>
            <div
              style={{
                fontSize: "28px",
                lineHeight: 1.35,
                color: "#334155",
              }}
            >
              Communication intelligence designed to create clarity, not chaos.
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
          <div>Private clarity before you hit send.</div>
          <div>BetweenLines AI</div>
        </div>
      </div>
    ),
    size,
  );
}
