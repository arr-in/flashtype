import { useNavigate } from "react-router-dom";
import { useUser, UserButton, SignInButton } from "@clerk/clerk-react";
import { getStoredUsername } from "../lib/userStats";

function Home() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();

  // Resolve display name from Clerk or localStorage fallback
  const username = getStoredUsername(isSignedIn ? user : null);

  function handleAction(path) {
    if (!isSignedIn) {
      // If Clerk is loaded but user isn't signed in, trigger sign-in flow
      return;
    }
    navigate(path);
  }

  return (
    <main className="solo-setup-page">
      {/* User identity widget */}
      <div className="home-username-widget">
        {!isLoaded ? (
          // Skeleton while Clerk loads
          <div className="username-display-box" style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "100px" }}>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>Loading…</span>
          </div>
        ) : isSignedIn ? (
          <div className="username-display-box" style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: "100px" }}>
            <UserButton afterSignOutUrl="/" />
            <span style={{ color: "#7fd9a8", fontWeight: "600" }}>{username}</span>
          </div>
        ) : (
          <SignInButton mode="modal">
            <button type="button" className="flash-start-button" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>
              Sign In
            </button>
          </SignInButton>
        )}
      </div>

      <div className="solo-setup-center">
        <h1 className="solo-setup-title">FlashType</h1>
        <p className="solo-setup-label" style={{ marginBottom: 8 }}>Choose your mode</p>

        <div className="solo-setup-group">
          <div className="home-mode-buttons">
            {isSignedIn ? (
              <>
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
              </>
            ) : (
              /* Not signed in — show a CTA to sign in */
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p className="solo-setup-label" style={{ marginBottom: 16 }}>
                  Sign in to start playing
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <SignInButton mode="modal">
                    <button type="button" className="flash-start-button" style={{ padding: "12px 28px" }}>
                      Sign In
                    </button>
                  </SignInButton>
                  <button
                    type="button"
                    className="lobby-secondary-btn"
                    style={{ padding: "12px 28px" }}
                    onClick={() => navigate("/sign-up")}
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="home-aux-links">
          <button type="button" className="home-aux-link" onClick={() => navigate("/leaderboard")}>
            🏆 Leaderboard
          </button>
          {isSignedIn && (
            <button type="button" className="home-aux-link" onClick={() => navigate("/stats")}>
              📊 My Stats
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default Home;
