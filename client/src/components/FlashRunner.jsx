/**
 * Animated speedster runner — used in race track and hero decoration.
 */
export function FlashRunner({ size = 48, isMoving = true }) {
  return (
    <div className={`speedster-runner flash-speedster ${isMoving ? "is-running" : ""}`} title="The Flash">
      <div className="speed-trail-ghost ghost-1 flash-ghost" />
      <div className="speed-trail-ghost ghost-2 flash-ghost" />
      <div className="speed-trail flash-trail" />

      <svg className="sparkle-layer" viewBox="0 0 60 60" fill="none" aria-hidden="true">
        <path d="M10 18L18 10L15 22L24 14" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-1" />
        <path d="M28 36L38 28L33 44L44 32" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-2" />
      </svg>

      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="runner-figure" aria-hidden="true">
        <g className="runner-body-group">
          <path d="M 22 18 L 14 24 L 8 18" stroke="#990000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-back" />
          <path d="M 22 28 L 14 36 L 6 44" stroke="#990000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-back" />
          <path d="M 24 16 L 20 29" stroke="#CC1111" strokeWidth="9" strokeLinecap="round" />
          <circle cx="22" cy="22" r="4.5" fill="#FFFFFF" stroke="#FFD700" strokeWidth="1" />
          <polygon points="24,19 19,23 22,23 20,26 25,21 22,21" fill="#CC1111" />
          <circle cx="27" cy="12" r="6.5" fill="#CC1111" />
          <polygon points="25,10 31,8 27,13" fill="#FFD700" />
          <path d="M 28 11 L 32 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 28 L 30 36 L 38 42" stroke="#CC1111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-front" />
          <path d="M 24 18 L 32 22 L 38 16" stroke="#CC1111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-front" />
        </g>
      </svg>
    </div>
  );
}

export function ReverseFlashRunner({ size = 48, isMoving = true }) {
  return (
    <div className={`speedster-runner reverse-flash-speedster ${isMoving ? "is-running" : ""}`} title="Reverse Flash">
      <div className="speed-trail-ghost ghost-1 reverse-flash-ghost" />
      <div className="speed-trail-ghost ghost-2 reverse-flash-ghost" />
      <div className="speed-trail reverse-flash-trail" />

      <svg className="sparkle-layer" viewBox="0 0 60 60" fill="none" aria-hidden="true">
        <path d="M10 18L18 10L15 22L24 14" stroke="#CC1111" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-1" />
        <path d="M28 36L38 28L33 44L44 32" stroke="#CC1111" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-2" />
      </svg>

      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="runner-figure" aria-hidden="true">
        <g className="runner-body-group">
          <path d="M 22 18 L 14 24 L 8 18" stroke="#B39700" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-back" />
          <path d="M 22 28 L 14 36 L 6 44" stroke="#B39700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-back" />
          <path d="M 24 16 L 20 29" stroke="#FFD700" strokeWidth="9" strokeLinecap="round" />
          <circle cx="22" cy="22" r="4.5" fill="#111111" stroke="#CC1111" strokeWidth="1" />
          <polygon points="24,19 19,23 22,23 20,26 25,21 22,21" fill="#CC1111" />
          <circle cx="27" cy="12" r="6.5" fill="#FFD700" />
          <polygon points="25,10 31,8 27,13" fill="#CC1111" />
          <path d="M 28 11 L 32 12" stroke="#CC1111" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 28 L 30 36 L 38 42" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-front" />
          <path d="M 24 18 L 32 22 L 38 16" stroke="#FFD700" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-front" />
        </g>
      </svg>
    </div>
  );
}
