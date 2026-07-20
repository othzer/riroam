import { ImageResponse } from "next/og";

// Generated at request time rather than shipped as a PNG, so the card can
// never drift from the brand tokens it's drawn from.
export const alt = "RiRoam — Roam the land of high passes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F8F8F5",
          padding: "72px 72px 0",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="64" height="48" viewBox="0 0 32 24">
              <path d="M1 22 L11 6 L16.5 14 L21 8 L31 22 Z" fill="#0D6E8F" />
              <path d="M11 6 L14 10.8 L11.4 14 L8.2 11.2 Z" fill="#FFFFFF" />
            </svg>
            <span style={{ fontSize: 40, fontWeight: 800, color: "#182635" }}>
              RiRoam
            </span>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              color: "#0D6E8F",
              letterSpacing: 4,
              marginTop: 48,
            }}
          >
            THE HIGH-ALTITUDE MARKETPLACE
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 800,
              color: "#182635",
              lineHeight: 1.05,
              marginTop: 16,
              maxWidth: 900,
            }}
          >
            Roam the land of high passes.
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#4A5A6A",
              marginTop: 24,
              maxWidth: 820,
            }}
          >
            Verified Ladakhi vendors · bookable stays, rides and circuits
          </div>
        </div>

        {/* the ridge, same silhouette as the site */}
        <svg width="1200" height="180" viewBox="0 0 400 120" preserveAspectRatio="none">
          <path d="M0 70 L60 34 L120 58 L190 22 L260 52 L330 30 L400 60 L400 120 L0 120 Z" fill="#BFDCE6" />
          <path d="M0 88 L70 58 L140 82 L210 50 L280 78 L350 56 L400 84 L400 120 L0 120 Z" fill="#5E9FB5" />
          <path d="M0 104 L90 82 L160 100 L240 78 L300 98 L370 84 L400 100 L400 120 L0 120 Z" fill="#EFE7D6" />
        </svg>
      </div>
    ),
    size,
  );
}
