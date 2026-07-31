function FlashRunner({ size = 48, isMoving = true }) {
  return (
    <div className={`speedster-runner flash-speedster ${isMoving ? "is-running" : ""}`} title="The Flash">
      {/* Speed Force Ghost Trails */}
      <div className="speed-trail-ghost ghost-1 flash-ghost" />
      <div className="speed-trail-ghost ghost-2 flash-ghost" />
      <div className="speed-trail flash-trail" />

      {/* Electric Lightning Sparks Layer */}
      <svg className="sparkle-layer" viewBox="0 0 60 60" fill="none">
        <path d="M10 18L18 10L15 22L24 14" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-1" />
        <path d="M28 36L38 28L33 44L44 32" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-2" />
      </svg>

      {/* Full Body Animated Speedster SVG */}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="runner-figure">
        <g className="runner-body-group">
          {/* Back Arm */}
          <path d="M 22 18 L 14 24 L 8 18" stroke="#990000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-back" />
          
          {/* Back Leg */}
          <path d="M 22 28 L 14 36 L 6 44" stroke="#990000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-back" />

          {/* Torso (Scarlet Red Suit) */}
          <path d="M 24 16 L 20 29" stroke="#CC1111" strokeWidth="9" strokeLinecap="round" />
          
          {/* Chest Emblem: Gold Circle + Lightning Bolt */}
          <circle cx="22" cy="22" r="4.5" fill="#FFFFFF" stroke="#FFD700" strokeWidth="1" />
          <polygon points="24,19 19,23 22,23 20,26 25,21 22,21" fill="#CC1111" />

          {/* Head & Cowl */}
          <circle cx="27" cy="12" r="6.5" fill="#CC1111" />
          {/* Gold Ear Wing */}
          <polygon points="25,10 31,8 27,13" fill="#FFD700" />
          {/* Eye Visor */}
          <path d="M 28 11 L 32 12" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

          {/* Front Leg */}
          <path d="M 22 28 L 30 36 L 38 42" stroke="#CC1111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-front" />

          {/* Front Arm */}
          <path d="M 24 18 L 32 22 L 38 16" stroke="#CC1111" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-front" />
        </g>
      </svg>
    </div>
  );
}

function ReverseFlashRunner({ size = 48, isMoving = true }) {
  return (
    <div className={`speedster-runner reverse-flash-speedster ${isMoving ? "is-running" : ""}`} title="Reverse Flash">
      {/* Speed Force Ghost Trails */}
      <div className="speed-trail-ghost ghost-1 reverse-flash-ghost" />
      <div className="speed-trail-ghost ghost-2 reverse-flash-ghost" />
      <div className="speed-trail reverse-flash-trail" />

      {/* Electric Lightning Sparks Layer */}
      <svg className="sparkle-layer" viewBox="0 0 60 60" fill="none">
        <path d="M10 18L18 10L15 22L24 14" stroke="#CC1111" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-1" />
        <path d="M28 36L38 28L33 44L44 32" stroke="#CC1111" strokeWidth="2.5" strokeLinecap="round" className="electric-spark spark-2" />
      </svg>

      {/* Full Body Animated Speedster SVG */}
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="runner-figure">
        <g className="runner-body-group">
          {/* Back Arm */}
          <path d="M 22 18 L 14 24 L 8 18" stroke="#B39700" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-back" />
          
          {/* Back Leg */}
          <path d="M 22 28 L 14 36 L 6 44" stroke="#B39700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-back" />

          {/* Torso (Yellow Suit) */}
          <path d="M 24 16 L 20 29" stroke="#FFD700" strokeWidth="9" strokeLinecap="round" />
          
          {/* Reverse Chest Emblem: Black Circle + Red Lightning Bolt */}
          <circle cx="22" cy="22" r="4.5" fill="#111111" stroke="#CC1111" strokeWidth="1" />
          <polygon points="24,19 19,23 22,23 20,26 25,21 22,21" fill="#CC1111" />

          {/* Head & Cowl */}
          <circle cx="27" cy="12" r="6.5" fill="#FFD700" />
          {/* Red Ear Wing */}
          <polygon points="25,10 31,8 27,13" fill="#CC1111" />
          {/* Glowing Red Eyes */}
          <path d="M 28 11 L 32 12" stroke="#CC1111" strokeWidth="2" strokeLinecap="round" />

          {/* Front Leg */}
          <path d="M 22 28 L 30 36 L 38 42" stroke="#FFD700" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="leg-front" />

          {/* Front Arm */}
          <path d="M 24 18 L 32 22 L 38 16" stroke="#FFD700" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="arm-front" />
        </g>
      </svg>
    </div>
  );
}

function RaceTrack({ players = [] }) {
  return (
    <div className="race-track-container">
      <div className="race-track-header">
        <span className="race-track-title">⚡ SPEEDSTER RACE TRACK ⚡</span>
      </div>
      <div className="race-track">
        {players.map((player, idx) => {
          const isFlash = idx % 2 === 0; // Player 1 = Flash, Player 2 = Reverse Flash
          const avatarRole = isFlash ? "THE FLASH" : "REVERSE FLASH";
          const progressPercent = Math.min(100, Math.max(0, player.progress || 0));
          const isMoving = !player.finished && !player.disqualified && (player.wpm || 0) > 0;

          return (
            <div key={player.username} className={`race-lane ${isFlash ? "lane-flash" : "lane-reverse-flash"}`}>
              <div className="race-lane-label">
                <span className="player-name">{player.username}</span>
                <span className={`role-badge ${isFlash ? "role-flash" : "role-reverse-flash"}`}>
                  ⚡ {avatarRole}
                </span>
              </div>

              <div className="race-lane-track">
                <div 
                  className="race-progress-bar"
                  style={{ 
                    width: `${progressPercent}%`,
                    background: isFlash 
                      ? "linear-gradient(90deg, rgba(204,17,17,0.2) 0%, rgba(255,215,0,0.8) 100%)" 
                      : "linear-gradient(90deg, rgba(255,215,0,0.2) 0%, rgba(204,17,17,0.8) 100%)"
                  }} 
                />
                
                <div className="race-runner-avatar" style={{ left: `${progressPercent}%` }}>
                  {player.disqualified ? (
                    <span className="disqualified-icon">✕ DQ</span>
                  ) : (
                    isFlash ? <FlashRunner size={48} isMoving={isMoving} /> : <ReverseFlashRunner size={48} isMoving={isMoving} />
                  )}
                </div>
              </div>

              <div className="race-lane-wpm">
                <span className="wpm-val">{Math.round(player.wpm || 0)}</span> WPM
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RaceTrack;
