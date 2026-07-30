import { useState } from "react";

/**
 * GuestUsernameModal
 * Shows a fullscreen modal asking the guest to pick a username.
 * Calls onConfirm(username) when submitted, onCancel() if dismissed.
 */
function GuestUsernameModal({ targetPath, onConfirm, onCancel }) {
  const [value, setValue] = useState(
    localStorage.getItem("username") || ""
  );
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 20) {
      setError("Username must be 20 characters or less.");
      return;
    }
    if (/\s/.test(trimmed)) {
      setError("Username cannot contain spaces.");
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setError("Only letters, numbers, _ and - are allowed.");
      return;
    }
    localStorage.setItem("username", trimmed);
    onConfirm(trimmed, targetPath);
  }

  return (
    <div className="guest-modal-overlay" onClick={onCancel}>
      <div
        className="guest-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Choose your username"
      >
        {/* Flash chest logo */}
        <div className="guest-modal-logo" aria-hidden="true">
          <svg viewBox="0 0 60 80" fill="none" className="flash-chest-bolt">
            <polygon
              points="38,2 14,38 28,38 22,78 46,32 32,32"
              fill="#FFD700"
              stroke="#CC1111"
              strokeWidth="2"
            />
          </svg>
        </div>

        <h2 className="guest-modal-title">Choose your name</h2>
        <p className="guest-modal-sub">
          Pick a unique username to race as a guest.
          <br />
          <span className="guest-modal-note">Scores won't count toward the leaderboard.</span>
        </p>

        <form onSubmit={handleSubmit} className="guest-modal-form">
          <input
            type="text"
            className="guest-modal-input"
            placeholder="e.g. SpeedyTyper99"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(""); }}
            maxLength={20}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          {error && <p className="guest-modal-error">{error}</p>}
          <button type="submit" className="guest-modal-submit">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18" style={{ marginRight: 8 }}>
              <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="currentColor"/>
            </svg>
            Let's Go!
          </button>
        </form>

        <button type="button" className="guest-modal-cancel" onClick={onCancel}>
          ← Back
        </button>
      </div>
    </div>
  );
}

export default GuestUsernameModal;
