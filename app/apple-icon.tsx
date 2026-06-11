import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "42px",
          background: "#172033",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "13px",
            width: "78px",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "11px",
              borderRadius: "999px",
              background: "#FFFDF8",
            }}
          />
          <div
            style={{
              marginLeft: "22px",
              width: "56px",
              height: "11px",
              borderRadius: "999px",
              background: "rgba(255,253,248,0.88)",
            }}
          />
          <div
            style={{
              width: "42px",
              height: "11px",
              borderRadius: "999px",
              background: "rgba(255,253,248,0.72)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: "26px",
            top: "26px",
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "8px solid #172033",
            background: "#64748B",
          }}
        />
      </div>
    ),
    size,
  );
}
