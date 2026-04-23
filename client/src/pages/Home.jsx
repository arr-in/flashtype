import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <main className="solo-setup-page">
      <div className="solo-setup-center">
        <h1 className="solo-setup-title">FlashType</h1>
        <p className="solo-setup-label" style={{ marginBottom: 8 }}>Choose your mode</p>

        <div className="solo-setup-group">
          <div className="home-mode-buttons">
            <button
              type="button"
              className="home-mode-btn"
              onClick={() => navigate("/solo")}
            >
              <span className="home-mode-icon">⚡</span>
              <span className="home-mode-name">Solo Practice</span>
              <span className="home-mode-desc">Train your speed &amp; accuracy alone</span>
            </button>

            <button
              type="button"
              className="home-mode-btn"
              onClick={() => navigate("/lobby")}
            >
              <span className="home-mode-icon">🏎️</span>
              <span className="home-mode-name">Play with Friends</span>
              <span className="home-mode-desc">Race others in real-time multiplayer</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Home;
