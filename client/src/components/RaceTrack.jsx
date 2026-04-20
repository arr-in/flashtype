function RaceTrack({ players = [] }) {
  return (
    <div className="race-track">
      {players.map((player) => (
        <div key={player.username} className="race-lane">
          <div className="race-lane-label">{player.username}</div>
          <div className="race-lane-track">
            <div className="race-car" style={{ left: `${Math.min(100, Math.max(0, player.progress || 0))}%` }}>
              {player.finished ? "✓" : "🚗"}
            </div>
          </div>
          <div className="race-lane-wpm">{Math.round(player.wpm || 0)} WPM</div>
        </div>
      ))}
    </div>
  );
}

export default RaceTrack;
