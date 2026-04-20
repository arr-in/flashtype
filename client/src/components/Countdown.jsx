function Countdown({ value, visible }) {
  if (!visible) return null;

  return (
    <div className="countdown-overlay">
      <div className="countdown-value">{value}</div>
    </div>
  );
}

export default Countdown;
