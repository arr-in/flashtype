import { FlashRunner, ReverseFlashRunner } from "./FlashRunner";

function RaceTrack({ players = [] }) {
  return (
    <div className="race-track-container">
      <div className="race-track-header">
        <span className="race-track-title">⚡ SPEEDSTER RACE TRACK ⚡</span>
      </div>
      <div className="race-track">
        {players.map((player, idx) => {
          const isFlash = idx % 2 === 0;
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
                      : "linear-gradient(90deg, rgba(255,215,0,0.2) 0%, rgba(204,17,17,0.8) 100%)",
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
