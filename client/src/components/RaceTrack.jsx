function FlashRunner({ size = 36 }) {
  return (
    <div className="speedster-runner flash-speedster" title="The Flash">
      <div className="speed-trail flash-trail" />
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="speedster-svg">
        {/* Scarlet red suit */}
        <circle cx="24" cy="24" r="21" fill="#CC1111" stroke="#FFD700" strokeWidth="2.5" />
        {/* Emblem circle background */}
        <circle cx="24" cy="24" r="13" fill="#FFFFFF" stroke="#FFD700" strokeWidth="1.5" />
        {/* Lightning bolt */}
        <polygon points="28,9 16,25 23,25 20,39 32,21 25,21" fill="#CC1111" stroke="#FFD700" strokeWidth="1" />
      </svg>
    </div>
  );
}

function ReverseFlashRunner({ size = 36 }) {
  return (
    <div className="speedster-runner reverse-flash-speedster" title="Reverse Flash">
      <div className="speed-trail reverse-flash-trail" />
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className="speedster-svg">
        {/* Gold/Yellow suit */}
        <circle cx="24" cy="24" r="21" fill="#FFD700" stroke="#CC1111" strokeWidth="2.5" />
        {/* Reverse Emblem circle background */}
        <circle cx="24" cy="24" r="13" fill="#111111" stroke="#CC1111" strokeWidth="1.5" />
        {/* Red Lightning bolt */}
        <polygon points="28,9 16,25 23,25 20,39 32,21 25,21" fill="#CC1111" stroke="#FFD700" strokeWidth="1" />
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
                    isFlash ? <FlashRunner size={36} /> : <ReverseFlashRunner size={36} />
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
