import { ImageResponse } from "next/og";

import { getChallengePageData } from "@/lib/data/challenges";

export const runtime = "nodejs";
const imageSize = {
  width: 1200,
  height: 630
};

export async function GET(
  _: Request,
  {
    params
  }: {
    params: Promise<{ challengeSlug: string }>;
  }
) {
  const { challengeSlug } = await params;
  const data = await getChallengePageData(challengeSlug);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const creator = data.participants.find((participant) => participant.isCreator)?.displayName ?? "Someone";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background:
            "radial-gradient(circle at top right, rgba(255,157,47,0.28), transparent 32%), linear-gradient(160deg, #08111f 0%, #101e35 48%, #071220 100%)",
          color: "#fff7e6",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 860 }}>
            <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              LockScore Challenge
            </div>
            <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase" }}>
              {data.challenge.title}
            </div>
            <div style={{ fontSize: 28, color: "rgba(255,255,255,0.78)" }}>{data.match.title}</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 240,
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              padding: 28,
              textAlign: "center"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                Created By
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, textTransform: "uppercase" }}>{creator}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", gap: 14 }}>
            {data.questions.slice(0, 5).map((question, index) => (
              <div
                key={question.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  width: 190,
                  borderRadius: 24,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  padding: 20
                }}
              >
                <div style={{ fontSize: 16, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  Pick {index + 1}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{question.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    imageSize
  );
}
