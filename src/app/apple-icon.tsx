import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(255,83,61,0.42), transparent 36%), linear-gradient(160deg, #08111f 0%, #0e1b31 48%, #071220 100%)",
          color: "#fff5db",
          fontSize: 180,
          fontWeight: 900,
          letterSpacing: "-0.08em"
        }}
      >
        LS
      </div>
    ),
    size
  );
}
