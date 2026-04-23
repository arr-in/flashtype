const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
  ["Space"]
];

function normalizeKeyMetrics(rawMetrics) {
  // Normalize all keys to uppercase to prevent case-mismatch issues
  const normalized = {};
  for (const [key, value] of Object.entries(rawMetrics || {})) {
    const upper = key.toUpperCase();
    if (normalized[upper]) {
      // merge metrics for same key (e.g. 'a' and 'A')
      normalized[upper].count += value.count || 0;
      normalized[upper].totalDelay += value.totalDelay || 0;
      normalized[upper].avgDelay =
        normalized[upper].count > 0
          ? normalized[upper].totalDelay / normalized[upper].count
          : 0;
    } else {
      normalized[upper] = { ...value };
    }
  }
  return normalized;
}

function getDelayRange(keyMetrics) {
  const values = Object.values(keyMetrics || {})
    .map((metric) => metric.avgDelay || 0)
    .filter((value) => value > 0);
  if (values.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function heatColor(key, keyMetrics, minDelay, maxDelay) {
  const metric = keyMetrics?.[key];
  if (!metric || !metric.count) return "#1f1f1f";

  const ratio = maxDelay > minDelay ? (metric.avgDelay - minDelay) / (maxDelay - minDelay) : 0.5;
  if (ratio > 0.75) return "#a33c3c";
  if (ratio > 0.5) return "#84553a";
  if (ratio > 0.25) return "#4d6c48";
  return "#2f7a4a";
}

function KeyboardHeatmap({ keyMetrics = {} }) {
  const normalizedMetrics = normalizeKeyMetrics(keyMetrics);
  const { min, max } = getDelayRange(normalizedMetrics);

  return (
    <div className="keyboard-heatmap">
      {keyboardRows.map((row, idx) => (
        <div className="keyboard-row" key={`row-${idx}`}>
          {row.map((key) => {
            const lookupKey = key.toUpperCase();
            const metric = normalizedMetrics[lookupKey];
            return (
              <div
                key={key}
                className={`key-cap ${key === "Space" ? "key-space" : ""} ${metric && metric.count ? "key-has-data" : ""}`}
                style={{ backgroundColor: heatColor(lookupKey, normalizedMetrics, min, max) }}
                title={metric ? `${key}: ${Math.round(metric.avgDelay)}ms avg (${metric.count} presses)` : `${key}: no data`}
              >
                {key}
                {metric && metric.count > 0 && (
                  <span className="key-delay-label">{Math.round(metric.avgDelay)}ms</span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      <div className="heatmap-legend">
        <span style={{ color: "#2f7a4a" }}>● Fast</span>
        <span style={{ color: "#4d6c48" }}>● Medium</span>
        <span style={{ color: "#84553a" }}>● Slow</span>
        <span style={{ color: "#a33c3c" }}>● Slowest</span>
      </div>
    </div>
  );
}

export default KeyboardHeatmap;
