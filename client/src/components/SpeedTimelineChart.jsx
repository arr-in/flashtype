import { useMemo, useState } from "react";

function getColor(username, fallback = "#7aa2ff") {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = (hash * 31 + username.charCodeAt(i)) % 360;
  }
  return `hsl(${hash}, 70%, 65%)`;
}

function SpeedTimelineChart({ timelineMap = {} }) {
  const [hoveredUser, setHoveredUser] = useState("");
  const players = Object.keys(timelineMap);

  const { maxT, maxWpm } = useMemo(() => {
    let t = 1;
    let w = 1;
    players.forEach((player) => {
      (timelineMap[player] || []).forEach((point) => {
        if (point.t > t) t = point.t;
        if (point.wpm > w) w = point.wpm;
      });
    });
    return { maxT: t, maxWpm: w };
  }, [players, timelineMap]);

  if (!players.length) return null;

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
            {player}
          </span>
        ))}
      </div>
      {hoveredUser && <div className="speed-chart-hover-label">Line: {hoveredUser}</div>}
      <svg viewBox="0 0 820 240" className="speed-chart">
        <rect x="0" y="0" width="820" height="240" fill="#111" stroke="#2a2a2a" />
        {players.map((player) => {
          const points = timelineMap[player] || [];
          if (points.length < 2) return null;
          const path = points
            .map((point, idx) => {
              const x = 20 + (point.t / maxT) * 780;
              const y = 220 - (point.wpm / maxWpm) * 200;
              return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
          const active = !hoveredUser || hoveredUser === player;
          return (
            <path
              key={player}
              d={path}
              fill="none"
              stroke={getColor(player)}
              strokeWidth={active ? 3 : 1.5}
              opacity={active ? 1 : 0.28}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default SpeedTimelineChart;
