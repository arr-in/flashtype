import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("username");
    if (saved) {
      setUsername(saved);
      setTempUsername(saved);
    }
  }, []);

  function handleSaveUsername() {
    const clean = tempUsername.trim();
    if (clean.length < 3 || clean.length > 15) {
      setError("Username must be 3-15 characters.");
      return;
    }
    localStorage.setItem("username", clean);
    setUsername(clean);
    setIsEditingUsername(false);
    setError("");
  }

  function handleAction(path) {
    if (!username) {
      setIsEditingUsername(true);
      setError("Please set a username first.");
      return;
    }
    navigate(path);
  }

  return (
    <main className="solo-setup-page">
      {/* Username Widget */}
      <div className="home-username-widget">
        {isEditingUsername ? (
          <div className="username-edit-box">
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter username..."
              maxLength={15}
              className="lobby-text-input"
              onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
              autoFocus
            />
            <button type="button" onClick={handleSaveUsername} className="flash-start-button" style={{ padding: "8px 16px", marginLeft: "8px" }}>Save</button>
            {username && <button type="button" onClick={() => { setIsEditingUsername(false); setError(""); setTempUsername(username); }} className="lobby-secondary-btn" style={{ padding: "8px 16px", marginLeft: "8px" }}>Cancel</button>}
            {error && <p className="error-text" style={{ fontSize: "0.85rem", marginTop: "4px" }}>{error}</p>}
          </div>
        ) : (
          <div className="username-display-box" style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "100px" }}>
            {username ? (
              <>
                <span style={{ color: "#7fd9a8", fontWeight: "600" }}>{username}</span>
                <button type="button" onClick={() => setIsEditingUsername(true)} className="lobby-secondary-btn" style={{ padding: "4px 12px", fontSize: "0.8rem", minHeight: "unset" }}>Change</button>
              </>
            ) : (
              <button type="button" onClick={() => setIsEditingUsername(true)} className="flash-start-button" style={{ padding: "6px 16px", fontSize: "0.9rem" }}>Set Username</button>
            )}
          </div>
        )}
      </div>

      <div className="solo-setup-center">
        <h1 className="solo-setup-title">FlashType</h1>
        <p className="solo-setup-label" style={{ marginBottom: 8 }}>Choose your mode</p>

        <div className="solo-setup-group">
          <div className="home-mode-buttons">
            <button
              type="button"
              className="home-mode-btn"
              onClick={() => handleAction("/solo")}
            >
              <span className="home-mode-icon">⚡</span>
              <span className="home-mode-name">Solo Practice</span>
              <span className="home-mode-desc">Train your speed &amp; accuracy alone</span>
            </button>

            <button
              type="button"
              className="home-mode-btn"
              onClick={() => handleAction("/online")}
            >
              <span className="home-mode-icon">🌍</span>
              <span className="home-mode-name">Play Online</span>
              <span className="home-mode-desc">Match with a random opponent</span>
            </button>

            <button
              type="button"
              className="home-mode-btn"
              onClick={() => handleAction("/lobby")}
            >
              <span className="home-mode-icon">🏎️</span>
              <span className="home-mode-name">Play with Friends</span>
              <span className="home-mode-desc">Race others in custom rooms</span>
            </button>
          </div>
        </div>

        <div className="home-aux-links">
          <button type="button" className="home-aux-link" onClick={() => navigate("/leaderboard")}>
            🏆 Leaderboard
          </button>
          <button type="button" className="home-aux-link" onClick={() => navigate("/stats")}>
            📊 My Stats
          </button>
        </div>
      </div>
    </main>
  );
}

export default Home;
