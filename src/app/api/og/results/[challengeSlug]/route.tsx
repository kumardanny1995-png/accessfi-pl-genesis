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

  if (!data || data.outcomes.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const winner = [...data.participants]
    .sort((left, right) => right.totalPoints - left.totalPoints || left.displayName.localeCompare(right.displayName))
    .at(0);

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
            "radial-gradient(circle at top right, rgba(35,209,139,0.24), transparent 34%), linear-gradient(160deg, #08111f 0%, #10203b 48%, #071220 100%)",
          color: "#fff7e6",
          fontFamily: "sans-serif"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760 }}>
            <div style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              LockScore Results
            </div>
            <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase" }}>
              {winner?.displayName ?? "Settled"}
            </div>
            <div style={{ fontSize: 30, color: "rgba(255,255,255,0.78)" }}>
              {winner ? `${winner.totalPoints}/${data.questions.length} on ${data.match.title}` : data.match.title}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 280,
              borderRadius: 28,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              padding: 28,
              textAlign: "center"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                Board Winner
              </div>
              <div style={{ fontSize: 46, fontWeight: 900, textTransform: "uppercase" }}>
                {winner?.displayName ?? "Pending"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {data.participants.slice(0, 4).map((participant, index) => (
            <div
              key={participant.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: 250,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.12)",
                background: index === 0 ? "rgba(35,209,139,0.18)" : "rgba(255,255,255,0.06)",
                padding: 20
              }}
            >
              <div style={{ fontSize: 16, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                Rank #{index + 1}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, textTransform: "uppercase" }}>{participant.displayName}</div>
              <div style={{ fontSize: 22, color: "rgba(255,255,255,0.82)" }}>{participant.totalPoints} points</div>
            </div>
          ))}
        </div>
      </div>
    ),
    imageSize
  );
}
