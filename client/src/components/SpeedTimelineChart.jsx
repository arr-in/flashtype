import { useMemo, useState } from "react";

const CHART_W = 760;   // drawable width (inside margins)
const CHART_H = 200;   // drawable height (inside margins)
const MARGIN_L = 52;   // left margin for Y axis labels
const MARGIN_B = 32;   // bottom margin for X axis labels
const MARGIN_T = 12;   // top
const MARGIN_R = 16;   // right
const SVG_W = MARGIN_L + CHART_W + MARGIN_R;
const SVG_H = MARGIN_T + CHART_H + MARGIN_B;

function getColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 70%, 65%)`;
}

function niceMax(val) {
  if (val <= 0) return 10;
  const step = val <= 50 ? 10 : val <= 150 ? 25 : 50;
  return Math.ceil(val / step) * step;
}

function SpeedTimelineChart({ timelineMap = {} }) {
  const [hoveredUser, setHoveredUser] = useState("");
  const players = Object.keys(timelineMap);

  const { minT, maxT, maxWpm } = useMemo(() => {
    let minT = Infinity;
    let t = 1;
    let w = 1;
    players.forEach((player) => {
      (timelineMap[player] || []).forEach((point) => {
        if (point.t < minT) minT = point.t;
        if (point.t > t) t = point.t;
        if (point.wpm > w) w = point.wpm;
      });
    });
    if (minT === Infinity) minT = 0;
    return { minT, maxT: Math.max(t - minT, 1), maxWpm: niceMax(w) };
  }, [players, timelineMap]);

  if (!players.length) return null;

  // Y axis ticks (WPM)
  const yTicks = [];
  const yStep = maxWpm <= 50 ? 10 : maxWpm <= 150 ? 25 : 50;
  for (let v = 0; v <= maxWpm; v += yStep) yTicks.push(v);

  // X axis ticks (seconds)
  const totalSec = Math.ceil(maxT / 1000);
  const xTickCount = Math.min(6, totalSec);
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) =>
    Math.round((i / xTickCount) * totalSec)
  );

  function toX(t) {
    return MARGIN_L + ((t - minT) / maxT) * CHART_W;
  }
  function toY(wpm) {
    return MARGIN_T + CHART_H - (wpm / maxWpm) * CHART_H;
  }

  return (
    <div className="speed-chart-wrap">
      <div className="speed-chart-legend">
        {players.map((player) => (
          <span
            key={player}
            className="speed-legend-item"
            onMouseEnter={() => setHoveredUser(player)}
            onMouseLeave={() => setHoveredUser("")}
            style={{ color: getColor(player) }}
          >
            <span className="speed-legend-dot" style={{ background: getColor(player) }} />
            {player}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="speed-chart"
        aria-label="Speed timeline chart"
      >
        {/* Background */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#0d0d0d" />
        {/* Chart area background */}
        <rect x={MARGIN_L} y={MARGIN_T} width={CHART_W} height={CHART_H} fill="#111" />

        {/* Y grid lines + labels */}
        {yTicks.map((v) => {
          const y = toY(v);
          return (
            <g key={`y-${v}`}>
              <line
                x1={MARGIN_L} y1={y} x2={MARGIN_L + CHART_W} y2={y}
                stroke={v === 0 ? "#333" : "#1e1e1e"} strokeWidth={v === 0 ? 1 : 0.8}
              />
              <text
                x={MARGIN_L - 6} y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#555"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text
          x={10} y={MARGIN_T + CHART_H / 2}
          textAnchor="middle"
          fontSize="10"
          fill="#444"
          transform={`rotate(-90, 10, ${MARGIN_T + CHART_H / 2})`}
        >
          WPM
        </text>

        {/* X axis ticks + labels */}
        {xTicks.map((sec) => {
          const x = toX(sec * 1000);
          return (
            <g key={`x-${sec}`}>
              <line
                x1={x} y1={MARGIN_T} x2={x} y2={MARGIN_T + CHART_H}
                stroke="#1e1e1e" strokeWidth={0.8}
              />
              <text
                x={x} y={MARGIN_T + CHART_H + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#555"
              >
                {sec}s
              </text>
            </g>
          );
        })}

        {/* X axis label */}
        <text
          x={MARGIN_L + CHART_W / 2}
          y={SVG_H - 2}
          textAnchor="middle"
          fontSize="10"
          fill="#444"
        >
          Time (seconds)
        </text>

        {/* Axis border */}
        <rect
          x={MARGIN_L} y={MARGIN_T}
          width={CHART_W} height={CHART_H}
          fill="none" stroke="#2a2a2a" strokeWidth={1}
        />

        {/* Data lines */}
        {players.map((player) => {
          const points = timelineMap[player] || [];
          if (points.length < 2) return null;
          const path = points
            .map((point, idx) => {
              const x = toX(point.t);
              const y = toY(point.wpm);
              return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ");
          const active = !hoveredUser || hoveredUser === player;
          return (
            <path
              key={player}
              d={path}
              fill="none"
              stroke={getColor(player)}
              strokeWidth={active ? 2.5 : 1}
              opacity={active ? 1 : 0.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}

        {/* Hover cursor dot — last point of hovered player */}
        {hoveredUser && (() => {
          const pts = timelineMap[hoveredUser] || [];
          if (!pts.length) return null;
          const last = pts[pts.length - 1];
          return (
            <circle
              cx={toX(last.t)} cy={toY(last.wpm)}
              r={4} fill={getColor(hoveredUser)} stroke="#0d0d0d" strokeWidth={1.5}
            />
          );
        })()}
      </svg>
    </div>
  );
}

export default SpeedTimelineChart;
