import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "18px",
          background: "#172033",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            width: "28px",
          }}
        >
          <div
            style={{
              width: "25px",
              height: "4px",
              borderRadius: "999px",
              background: "#FFFDF8",
            }}
          />
          <div
            style={{
              marginLeft: "8px",
              width: "20px",
              height: "4px",
              borderRadius: "999px",
              background: "rgba(255,253,248,0.88)",
            }}
          />
          <div
            style={{
              width: "15px",
              height: "4px",
              borderRadius: "999px",
              background: "rgba(255,253,248,0.72)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: "8px",
            width: "11px",
            height: "11px",
            borderRadius: "999px",
            background: "#64748B",
          }}
        />
      </div>
    ),
    size,
  );
}
