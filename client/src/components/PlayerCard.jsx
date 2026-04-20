function placementLabel(placement) {
  if (placement === 1) return "1st 🥇";
  if (placement === 2) return "2nd 🥈";
  if (placement === 3) return "3rd 🥉";
  return `${placement}th`;
}

function PlayerCard({ player, highlighted = false }) {
  return (
    <div className={`player-card ${highlighted ? "highlighted" : ""}`}>
      <div>{player.username}</div>
      <div>{placementLabel(player.placement)}</div>
      <div>WPM: {player.wpm}</div>
      <div>Accuracy: {player.accuracy}%</div>
      {typeof player.score === "number" && <div>Score: {player.score}</div>}
      <div>Time: {player.timeMs ? `${(player.timeMs / 1000).toFixed(2)}s` : "DNF"}</div>
    </div>
  );
}

export default PlayerCard;
