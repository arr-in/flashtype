import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, SignInButton } from "@clerk/clerk-react";
import { getStoredUsername } from "../lib/userStats";
import GuestUsernameModal from "../components/GuestUsernameModal";
import TextType from "../components/TextType";
import ElectricBorder from "../components/ElectricBorder";
import FlashRunnerHero from "../components/FlashRunnerHero";

/* The Flash chest lightning bolt — scarlet red circle with gold bolt */
function FlashLogo({ size = 64 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      className="flash-logo-svg"
      aria-label="Flash logo"
    >
      <circle cx="40" cy="40" r="38" fill="#CC1111" stroke="#FFD700" strokeWidth="3" />
      <polygon
        points="48,8 22,44 36,44 32,72 58,34 44,34"
        fill="#FFD700"
      />
    </svg>
  );
}

function ModeCard({ title, desc, featured, badge, onClick }) {
  return (
    <button
      type="button"
      className={`hm-card${featured ? " hm-card--featured" : ""}`}
      onClick={onClick}
    >
      {badge && <span className="hm-card-badge">{badge}</span>}
      <span className="hm-card-title">{title}</span>
      <span className="hm-card-desc">{desc}</span>
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
      {/* Speed lines background */}
      <div className="hm-speed-lines" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`hm-speed-line hm-speed-line--${i}`} />
        ))}
      </div>

      {/* Hero */}
      <div className="hm-hero">
        <div className="hm-hero-logo">
          <FlashLogo size={72} />
        </div>
        <h1 className="hm-title">FlashType</h1>
        
        <div className="hm-subtitle-container">
          <TextType 
            text={[
              "Real-time multiplayer typing platform",
              "Test your speed and accuracy",
              "Compete with players worldwide"
            ]}
            typingSpeed={40}
            deletingSpeed={20}
            pauseDuration={3000}
            showCursor={true}
            cursorCharacter="|"
            cursorBlinkDuration={0.5}
            className="hm-subtitle-text"
            cursorClassName="hm-subtitle-cursor"
            variableSpeed={{ min: 30, max: 60 }}
          />
        </div>

        {isSignedIn && (
          <div className="hm-hero-tag">
            <span className="hm-tag-dot" />
            Signed in as <strong>{username}</strong> — scores saved to leaderboard
          </div>
        )}

        <FlashRunnerHero />
      </div>

      {/* Mode cards */}
      <div className="hm-modes">
        {isSignedIn ? (
          <>
            <ElectricBorder color="#e5b700" speed={0.9} chaos={0.08} borderRadius={16} hoverOnly={true}>
              <ModeCard
                title="Solo Practice"
                desc="Train your speed & accuracy alone"
                onClick={() => navigate("/solo")}
              />
            </ElectricBorder>
            <ElectricBorder color="#e5b700" speed={1} chaos={0.1} borderRadius={16} hoverOnly={true}>
              <ModeCard
                title="Play Online"
                desc="Match with a random opponent"
                featured
                onClick={() => navigate("/online")}
              />
            </ElectricBorder>
            <ElectricBorder color="#e5b700" speed={0.9} chaos={0.08} borderRadius={16} hoverOnly={true}>
              <ModeCard
                title="Play with Friends"
                desc="Race others in custom rooms"
                onClick={() => navigate("/lobby")}
              />
            </ElectricBorder>
          </>
        ) : (
          <>
            <ElectricBorder color="#e5b700" speed={0.9} chaos={0.08} borderRadius={16} hoverOnly={true}>
              <ModeCard
                title="Solo Practice"
                desc="Train your speed & accuracy alone"
                onClick={() => handleGuestModeClick("/solo")}
              />
            </ElectricBorder>
            <ElectricBorder color="#e5b700" speed={1} chaos={0.1} borderRadius={16} hoverOnly={true}>
              <ModeCard
                title="Play Online"
                desc="Match with a random opponent"
                featured
                onClick={() => handleGuestModeClick("/online")}
              />
            </ElectricBorder>
            <ElectricBorder color="#e5b700" speed={0.9} chaos={0.08} borderRadius={16} hoverOnly={true}>
              <ModeCard
                title="Play with Friends"
                desc="Race others in custom rooms"
                onClick={() => handleGuestModeClick("/lobby")}
              />
            </ElectricBorder>
          </>
        )}
      </div>

      {/* Guest CTA when not signed in */}
      {!isSignedIn && (
        <p className="hm-guest-hint">
          Playing as guest — scores won't count toward leaderboard.{" "}
          <SignInButton mode="modal">
            <span className="hm-inline-link">Sign in to save them.</span>
          </SignInButton>
        </p>
      )}

      {isSignedIn && (
        <div className="hm-aux">
          <button type="button" className="hm-aux-link" onClick={() => navigate("/stats")}>
            📊 My Stats
          </button>
        </div>
      )}

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
