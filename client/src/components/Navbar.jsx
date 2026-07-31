import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BubbleMenu from "./BubbleMenu";

function FlashLogo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-label="Flash logo"
    >
      <circle cx="40" cy="40" r="38" fill="#CC1111" stroke="#FFD700" strokeWidth="3" />
      <polygon points="48,8 22,44 36,44 32,72 58,34 44,34" fill="#FFD700" />
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  const items = [
    {
      label: "Home 🏠",
      ariaLabel: "Home Page",
      rotation: -6,
      hoverStyles: { bgColor: "#cc1111", textColor: "#ffffff" },
      onClick: () => navigate("/")
    },
    {
      label: "Leaderboard 🏆",
      ariaLabel: "Leaderboard",
      rotation: 6,
      hoverStyles: { bgColor: "#ffd700", textColor: "#111111" },
      onClick: () => navigate("/leaderboard")
    },
    {
      label: "Contact Developers ✉️",
      ariaLabel: "Contact Developers",
      rotation: -4,
      hoverStyles: { bgColor: "#8b5cf6", textColor: "#ffffff" },
      onClick: () => setShowContactModal(true)
    },
    {
      label: "Solo Practice ⚡",
      ariaLabel: "Solo Practice",
      rotation: 6,
      hoverStyles: { bgColor: "#3b82f6", textColor: "#ffffff" },
      onClick: () => navigate("/solo")
    },
    {
      label: "Play Online 🌍",
      ariaLabel: "Play Online",
      rotation: -6,
      hoverStyles: { bgColor: "#10b981", textColor: "#ffffff" },
      onClick: () => navigate("/online")
    },
    {
      label: "Custom Rooms 🏎️",
      ariaLabel: "Custom Rooms Lobby",
      rotation: 6,
      hoverStyles: { bgColor: "#f59e0b", textColor: "#ffffff" },
      onClick: () => navigate("/lobby")
    },
    {
      label: "My Stats 📊",
      ariaLabel: "My Stats",
      rotation: -4,
      hoverStyles: { bgColor: "#ec4899", textColor: "#ffffff" },
      onClick: () => navigate("/stats")
    }
  ];

  return (
    <>
      <BubbleMenu
        logo={
          <div 
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            <FlashLogo size={28} />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "0.5px" }}>
              FlashType
            </span>
          </div>
        }
        items={items}
        menuAriaLabel="Toggle FlashType navigation menu"
        menuBg="#181824"
        menuContentColor="#ffffff"
        useFixedPosition={true}
        animationEase="back.out(1.5)"
        animationDuration={0.4}
        staggerDelay={0.08}
      />

      {/* Contact Developers Modal */}
      {showContactModal && (
        <div 
          className="contact-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
          onClick={() => setShowContactModal(false)}
        >
          <div 
            style={{
              background: "#1e1e2d",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "480px",
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              color: "#fff"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <span>✉️</span> Contact Developers
              </h2>
              <button 
                type="button" 
                onClick={() => setShowContactModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#aaa",
                  fontSize: "1.5rem",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ color: "#aaa", lineHeight: 1.6, marginBottom: "20px" }}>
              Have feedback, bug reports, or feature suggestions for <strong>FlashType</strong>? We'd love to hear from you!
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <a 
                href="mailto:contact@flashtype.dev" 
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#ffd700",
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                📧 Email: contact@flashtype.dev
              </a>
              <a 
                href="https://github.com/arr-in/flashtype" 
                target="_blank" 
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 600
                }}
              >
                💻 GitHub: github.com/arr-in/flashtype
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background: "#cc1111",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
