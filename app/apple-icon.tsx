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
          background: "#0f172a",
          color: "#fff2d8",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "106px",
          fontWeight: 900,
          position: "relative",
        }}
      >
        T
        <div
          style={{
            position: "absolute",
            right: "26px",
            top: "26px",
            width: "28px",
            height: "28px",
            borderRadius: "999px",
            border: "8px solid #0f172a",
            background: "#2f6fed",
          }}
        />
      </div>
    ),
    size,
  );
}

