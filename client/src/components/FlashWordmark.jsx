/**
 * FlashType wordmark — typographic brand mark with typing cursor accent.
 * Communicates speed + precision without a generic lightning bolt.
 */
export default function FlashWordmark({ size = "md", onClick, className = "" }) {
  const sizes = {
    sm: { fontSize: "1rem", cursorH: "1.1em", gap: "0" },
    md: { fontSize: "1.15rem", cursorH: "1.15em", gap: "0" },
    lg: { fontSize: "1.35rem", cursorH: "1.2em", gap: "0" },
  };
  const s = sizes[size] || sizes.md;

  const Tag = onClick ? "button" : "div";
  const tagProps = onClick
    ? { type: "button", onClick, "aria-label": "FlashType home" }
    : { "aria-label": "FlashType" };

  return (
    <Tag
      className={`ft-wordmark ${className}`}
      style={{ fontSize: s.fontSize }}
      {...tagProps}
    >
      <span className="ft-wordmark-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="20" height="20" rx="5" fill="rgba(204,17,17,0.15)" stroke="rgba(204,17,17,0.5)" strokeWidth="1" />
          <path
            d="M6 14 L6 8 L10 8 L8 11 L12 11 L7 16 L9 12 L6 12 Z"
            fill="#FFD700"
            className="ft-wordmark-flash-shape"
          />
        </svg>
      </span>
      <span className="ft-wordmark-text">
        <span className="ft-wordmark-flash">Flash</span>
        <span className="ft-wordmark-type">Type</span>
        <span className="ft-wordmark-cursor" style={{ height: s.cursorH }} aria-hidden="true" />
      </span>
    </Tag>
  );
}
