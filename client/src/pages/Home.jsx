import { useNavigate } from "react-router-dom";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { getStoredUsername } from "../lib/userStats";

function Home() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();

  const username = getStoredUsername(isSignedIn ? user : null);

  function playAsGuest(path) {
    // Generate a guest username and store it
    const guestName = "Guest" + Math.floor(1000 + Math.random() * 9000);
    if (!localStorage.getItem("username")) {
      localStorage.setItem("username", guestName);
    }
    navigate(path);
  }

  return (
    <main className="home-page">
      {/* Ambient background bolts */}
      <div className="home-bg-bolts" aria-hidden="true">
        <svg className="bolt bolt-1" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="currentColor"/>
        </svg>
        <svg className="bolt bolt-2" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="currentColor"/>
        </svg>
        <svg className="bolt bolt-3" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="currentColor"/>
        </svg>
      </div>

      {/* Top-right user widget */}
      <div className="home-topbar">
        {!isLoaded ? null : isSignedIn ? (
          <div className="home-user-pill">
            <UserButton afterSignOutUrl="/" />
            <span className="home-user-name">{username}</span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "10px" }}>
            <SignInButton mode="modal">
              <button type="button" className="home-signin-btn">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="home-signup-btn">Sign Up</button>
            </SignUpButton>
          </div>
        )}
      </div>

      {/* Hero */}
      <div className="home-hero">
        <div className="home-logo-wrap">
          <svg className="home-bolt-logo" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="currentColor"/>
          </svg>
          <h1 className="home-title">FlashType</h1>
        </div>
        <p className="home-subtitle">Real-time multiplayer typing battles</p>
      </div>

      {/* Mode cards */}
      {isSignedIn ? (
        <div className="home-modes">
          <button type="button" className="home-mode-card" onClick={() => navigate("/solo")}>
            <span className="home-card-icon">⚡</span>
            <span className="home-card-title">Solo Practice</span>
            <span className="home-card-desc">Train your speed &amp; accuracy alone</span>
          </button>

          <button type="button" className="home-mode-card home-mode-card--featured" onClick={() => navigate("/online")}>
            <span className="home-card-badge">LIVE</span>
            <span className="home-card-icon">🌍</span>
            <span className="home-card-title">Play Online</span>
            <span className="home-card-desc">Match with a random opponent</span>
          </button>

          <button type="button" className="home-mode-card" onClick={() => navigate("/lobby")}>
            <span className="home-card-icon">🏎️</span>
            <span className="home-card-title">Play with Friends</span>
            <span className="home-card-desc">Race others in custom rooms</span>
          </button>
        </div>
      ) : (
        /* Not signed in — show all modes + guest option */
        <div className="home-guest-section">
          <div className="home-modes">
            <SignInButton mode="modal">
              <button type="button" className="home-mode-card">
                <span className="home-card-icon">⚡</span>
                <span className="home-card-title">Solo Practice</span>
                <span className="home-card-desc">Train your speed &amp; accuracy alone</span>
              </button>
            </SignInButton>

            <SignInButton mode="modal">
              <button type="button" className="home-mode-card home-mode-card--featured">
                <span className="home-card-badge">LIVE</span>
                <span className="home-card-icon">🌍</span>
                <span className="home-card-title">Play Online</span>
                <span className="home-card-desc">Match with a random opponent</span>
              </button>
            </SignInButton>

            <SignInButton mode="modal">
              <button type="button" className="home-mode-card">
                <span className="home-card-icon">🏎️</span>
                <span className="home-card-title">Play with Friends</span>
                <span className="home-card-desc">Race others in custom rooms</span>
              </button>
            </SignInButton>
          </div>

          <div className="home-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="home-guest-btn"
            onClick={() => playAsGuest("/solo")}
          >
            ⚡ Play as Guest
          </button>
          <p className="home-guest-note">No account needed — guest stats won't be saved</p>
        </div>
      )}

      {/* Aux links */}
      <div className="home-aux">
        <button type="button" className="home-aux-link" onClick={() => navigate("/leaderboard")}>
          🏆 Leaderboard
        </button>
        {isSignedIn && (
          <button type="button" className="home-aux-link" onClick={() => navigate("/stats")}>
            📊 My Stats
          </button>
        )}
      </div>
    </main>
  );
}

export default Home;
