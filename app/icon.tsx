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
          background: "#0f172a",
          color: "#fff2d8",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "38px",
          fontWeight: 900,
          position: "relative",
        }}
      >
        T
        <div
          style={{
            position: "absolute",
            right: "8px",
            top: "8px",
            width: "11px",
            height: "11px",
            borderRadius: "999px",
            background: "#2f6fed",
          }}
        />
      </div>
    ),
    size,
  );
}

