import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { getStoredUsername } from "../lib/userStats";
import GuestUsernameModal from "../components/GuestUsernameModal";
import TextType from "../components/TextType";
import ElectricBorder from "../components/ElectricBorder";
import FlashRunnerHero from "../components/FlashRunnerHero";

/* The Flash chest lightning bolt emblem with kinetic glowing ring */
function FlashLogo({ size = 76 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className="flash-logo-svg"
      aria-label="Flash logo"
    >
      <circle cx="40" cy="40" r="38" fill="#E50914" stroke="#FFD700" strokeWidth="3.5" />
      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255, 215, 0, 0.4)" strokeWidth="1" strokeDasharray="4 4" />
      <polygon
        points="48,8 22,44 36,44 32,72 58,34 44,34"
        fill="#FFD700"
      />
    </svg>
  );
}

function ModeCard({ title, desc, icon, featured, badge, onClick }) {
  return (
    <button
      type="button"
      className={`hm-card${featured ? " hm-card--featured" : ""}`}
      onClick={onClick}
    >
      <div className="hm-card-header-row">
        <div className="hm-card-icon-wrap">{icon}</div>
        {badge && <span className="hm-card-badge">{badge}</span>}
      </div>
      <div className="hm-card-body">
        <span className="hm-card-title">{title}</span>
        <span className="hm-card-desc">{desc}</span>
        <span className="hm-card-arrow">Launch Track →</span>
      </div>
    </button>
  );
}

function Home() {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const [guestTarget, setGuestTarget] = useState(null); // path waiting for username

  const username = getStoredUsername(isSignedIn ? user : null);

  /* Called when a mode card is clicked while not signed in */
  function handleGuestModeClick(path) {
    const stored = localStorage.getItem("username");
    if (stored && stored.length >= 3) {
      // Already has a valid username — go straight
      navigate(path);
    } else {
      // Show username modal first
      setGuestTarget(path);
    }
  }

  /* Called from modal when username is confirmed */
  function handleGuestConfirm(name, path) {
    setGuestTarget(null);
    navigate(path);
  }

  return (
    <main className="hm-page">
      {/* Kinetic Speed lines background */}
      <div className="hm-speed-lines" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`hm-speed-line hm-speed-line--${i}`} />
        ))}
      </div>

      {/* Hero Header */}
      <div className="hm-hero">
        <div className="hm-hero-logo" onClick={() => navigate("/solo")} title="Start Speed Typing">
          <FlashLogo size={84} />
        </div>
        <h1 className="hm-title">FlashType</h1>

        <div className="hm-subtitle-container">
          <TextType
            text={[
              "Real-time multiplayer speed typing arena",
              "Sub-millisecond WPM & accuracy telemetry",
              "Race against competitive typists worldwide"
            ]}
            typingSpeed={38}
            deletingSpeed={18}
            pauseDuration={2800}
            showCursor={true}
            cursorCharacter="│"
            cursorBlinkDuration={0.5}
            className="hm-subtitle-text"
            cursorClassName="hm-subtitle-cursor"
            variableSpeed={{ min: 30, max: 55 }}
          />
        </div>

        {isSignedIn && (
          <div className="hm-hero-tag">
            <span className="hm-tag-dot" />
            Signed in as <strong>{username}</strong> — scores recorded on global leaderboard
          </div>
        )}

        <FlashRunnerHero />
      </div>

      {/* Game Mode selection cards */}
      <div className="hm-modes">
        {isSignedIn ? (
          <>
            <ElectricBorder color="#FFD700" speed={0.9} chaos={0.08} borderRadius={20} hoverOnly={true}>
              <ModeCard
                icon="⚡"
                title="Solo Practice"
                desc="Sharpen speed, accuracy & keystroke heatmaps alone"
                onClick={() => navigate("/solo")}
              />
            </ElectricBorder>
            <ElectricBorder color="#FFD700" speed={1} chaos={0.1} borderRadius={20} hoverOnly={true}>
              <ModeCard
                icon="🏎️"
                title="Play Online"
                desc="Instant 1v1 matchmaking against random opponents"
                featured
                badge="POPULAR"
                onClick={() => navigate("/online")}
              />
            </ElectricBorder>
            <ElectricBorder color="#FFD700" speed={0.9} chaos={0.08} borderRadius={20} hoverOnly={true}>
              <ModeCard
                icon="🏁"
                title="Custom Rooms"
                desc="Create or join private race lobbies with friends"
                onClick={() => navigate("/lobby")}
              />
            </ElectricBorder>
          </>
        ) : (
          <>
            <ElectricBorder color="#FFD700" speed={0.9} chaos={0.08} borderRadius={20} hoverOnly={true}>
              <ModeCard
                icon="⚡"
                title="Solo Practice"
                desc="Sharpen speed, accuracy & keystroke heatmaps alone"
                onClick={() => handleGuestModeClick("/solo")}
              />
            </ElectricBorder>
            <ElectricBorder color="#FFD700" speed={1} chaos={0.1} borderRadius={20} hoverOnly={true}>
              <ModeCard
                icon="🏎️"
                title="Play Online"
                desc="Instant 1v1 matchmaking against random opponents"
                featured
                badge="POPULAR"
                onClick={() => handleGuestModeClick("/online")}
              />
            </ElectricBorder>
            <ElectricBorder color="#FFD700" speed={0.9} chaos={0.08} borderRadius={20} hoverOnly={true}>
              <ModeCard
                icon="🏁"
                title="Custom Rooms"
                desc="Create or join private race lobbies with friends"
                onClick={() => handleGuestModeClick("/lobby")}
              />
            </ElectricBorder>
          </>
        )}
      </div>

      {/* Telemetry & Platform Highlights Grid */}
      <section className="hm-telemetry" aria-label="Platform Telemetry Features">
        <div className="hm-telemetry-header">
          <span className="hm-telemetry-subtitle">ENGINE TELEMETRY</span>
          <h2 className="hm-telemetry-title">Built for Peak Velocity & Precision</h2>
        </div>
        <div className="hm-telemetry-grid">
          <div className="hm-telemetry-card">
            <span className="hm-telemetry-stat-value">⚡ 100%</span>
            <span className="hm-telemetry-stat-label">Real-Time Socket Sync</span>
            <span className="hm-telemetry-stat-desc">Low-latency position broadcasting keeps multiplayer races in perfect sync.</span>
          </div>
          <div className="hm-telemetry-card">
            <span className="hm-telemetry-stat-value">📈 Live</span>
            <span className="hm-telemetry-stat-label">WPM & Key Heatmaps</span>
            <span className="hm-telemetry-stat-desc">Track burst speed timelines, key latency, and error breakdown frame-by-frame.</span>
          </div>
          <div className="hm-telemetry-card">
            <span className="hm-telemetry-stat-value">🏆 Global</span>
            <span className="hm-telemetry-stat-label">Clerk & Supabase Auth</span>
            <span className="hm-telemetry-stat-desc">Compete for the top spot on global leaderboard rankings with persistent stats.</span>
          </div>
        </div>
      </section>

      {/* Guest CTA when not signed in */}
      {!isSignedIn && (
        <p className="hm-guest-hint">
          Playing as guest — scores won't count toward global rankings.{" "}
          <SignInButton mode="modal">
            <span className="hm-inline-link">Sign in to claim your rank.</span>
          </SignInButton>
        </p>
      )}

      {/* Quick Navigation Pills */}
      <div className="hm-aux">
        {isSignedIn && (
          <button type="button" className="hm-aux-link" onClick={() => navigate("/stats")}>
            📊 My Performance Stats
          </button>
        )}
        <button type="button" className="hm-aux-link" onClick={() => navigate("/leaderboard")}>
          🏆 Global Leaderboard
        </button>
      </div>

      {/* Guest username modal */}
      {guestTarget && (
        <GuestUsernameModal
          targetPath={guestTarget}
          onConfirm={handleGuestConfirm}
          onCancel={() => setGuestTarget(null)}
        />
      )}
    </main>
  );
}

export default Home;
