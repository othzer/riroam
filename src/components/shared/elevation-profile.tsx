"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { acclimatizeDayCount } from "@/lib/itinerary";

// Signature UI: a package itinerary rendered as a day-by-day elevation profile.
// Pure SVG (no chart lib). Geometry follows the design spec §10 exactly.
export type ElevationDay = {
  dayNumber: number;
  altitudeMeters: number;
  passName?: string | null;
};

const VB_W = 400;
const PLOT_X0 = 16;
const PLOT_X1 = 392;
const PLOT_TOP = 14;
const PLOT_BOTTOM = 118;

// y maps 2,900 m -> 118 and 5,600 m -> 14 (linear), clamped to the plot.
const ALT_MIN = 2900;
const ALT_MAX = 5600;
function altToY(alt: number) {
  const clamped = Math.max(ALT_MIN, Math.min(ALT_MAX, alt));
  return (
    PLOT_BOTTOM +
    ((clamped - ALT_MIN) * (PLOT_TOP - PLOT_BOTTOM)) / (ALT_MAX - ALT_MIN)
  );
}

// days start at x=30, evenly spaced up to x=370.
function dayToX(index: number, count: number) {
  if (count <= 1) return 200;
  return 30 + (index * (370 - 30)) / (count - 1);
}

const GRIDLINES = [
  { alt: 3500, label: "3.5k" },
  { alt: 4500, label: "4.5k" },
  { alt: 5500, label: "5.5k" },
];

export function ElevationProfile({
  days,
  className,
  animate = true,
}: {
  days: ElevationDay[];
  className?: string;
  animate?: boolean;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [animate]);

  if (days.length === 0) return null;

  const points = days.map((d, i) => ({
    x: dayToX(i, days.length),
    y: altToY(d.altitudeMeters),
    day: d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    `M ${points[0].x.toFixed(1)} ${PLOT_BOTTOM} ` +
    points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
    ` L ${points[points.length - 1].x.toFixed(1)} ${PLOT_BOTTOM} Z`;

  const accCount = acclimatizeDayCount(days);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB_W} 136`}
      className={cn("w-full", className)}
      role="img"
      aria-label="Itinerary elevation profile by day"
    >
      {/* acclimatization band */}
      {accCount >= 1 && (
        <>
          <rect
            x={PLOT_X0}
            y={PLOT_TOP}
            width={
              Math.max(
                points[Math.min(accCount, points.length) - 1].x,
                points[0].x,
              ) - PLOT_X0
            }
            height={PLOT_BOTTOM - PLOT_TOP}
            fill="var(--apricot-tint)"
          />
          <text
            x={PLOT_X0 + 3}
            y={PLOT_TOP + 10}
            fontSize={11}
            fill="var(--apricot-text)"
          >
            acclimatize
          </text>
        </>
      )}

      {/* gridlines */}
      {GRIDLINES.map((g) => {
        const y = altToY(g.alt);
        return (
          <g key={g.alt}>
            <line
              x1={PLOT_X0}
              x2={PLOT_X1}
              y1={y}
              y2={y}
              stroke="#E5E1D5"
              strokeDasharray="3 3"
            />
            <text
              x={PLOT_X1}
              y={y - 2}
              fontSize={11}
              textAnchor="end"
              fill="var(--ink-muted)"
            >
              {g.label}
            </text>
          </g>
        );
      })}

      {/* area + line */}
      <path
        d={areaPath}
        fill="var(--pangong-tint)"
        style={{
          opacity: visible ? 1 : 0,
          transition: animate ? "opacity 600ms ease" : undefined,
        }}
      />
      <path
        d={linePath}
        fill="none"
        stroke="var(--pangong)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: visible ? 0 : 1,
          transition: animate ? "stroke-dashoffset 600ms ease" : undefined,
        }}
      />

      {/* dots + pass labels + day labels */}
      {points.map((p, i) => {
        const isPass = !!p.day.passName;
        return (
          <g key={i}>
            {isPass && (
              <text
                x={p.x}
                y={p.y - 8}
                fontSize={11}
                textAnchor="middle"
                fill="var(--ink)"
              >
                {p.day.passName}
              </text>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={isPass ? 4 : 3.5}
              fill={isPass ? "var(--apricot)" : "var(--surface)"}
              stroke={isPass ? "var(--ink)" : "var(--pangong)"}
              strokeWidth={isPass ? 1.5 : 2}
            />
            <text
              x={p.x}
              y={132}
              fontSize={11}
              textAnchor="middle"
              fill="var(--ink-muted)"
            >
              D{p.day.dayNumber}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
