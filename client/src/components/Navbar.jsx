import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser, UserButton, SignInButton, SignUpButton } from "@clerk/clerk-react";
import FlashWordmark from "./FlashWordmark";
import ElectricBorder from "./ElectricBorder";
import { getStoredUsername } from "../lib/userStats";
import "./Navbar.css";

const PRIMARY_NAV = [
  { path: "/", label: "Home", ariaLabel: "Home" },
  { path: "/leaderboard", label: "Leaderboard", ariaLabel: "Leaderboard", featured: true },
];

const SECONDARY_NAV = [
  { path: "/solo", label: "Solo", ariaLabel: "Solo Practice" },
  { path: "/online", label: "Online", ariaLabel: "Play Online" },
  { path: "/lobby", label: "Rooms", ariaLabel: "Custom Rooms" },
];

const ACTION_NAV = [
  { path: "/stats", label: "Stats", ariaLabel: "My Stats" },
  { action: "contact", label: "Contact", ariaLabel: "Contact Developers" },
];

function NavLink({ item, isActive, onClick, className = "" }) {
  const navigate = useNavigate();

  function handleClick() {
    if (item.action === "contact") {
      onClick?.("contact");
    } else {
      navigate(item.path);
    }
    onClick?.("navigate");
  }

  return (
    <button
      type="button"
      className={[
        className,
        isActive ? `${className}--active` : "",
        item.featured ? `${className}--leaderboard` : "",
      ].filter(Boolean).join(" ")}
      onClick={handleClick}
      aria-label={item.ariaLabel}
      aria-current={isActive ? "page" : undefined}
    >
      {item.featured && <span className="ft-nav-link-icon" aria-hidden="true">🏆</span>}
      {item.label}
    </button>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const username = getStoredUsername(isSignedIn ? user : null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function isActive(path) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  function handleMobileAction(action) {
    if (action === "contact") {
      setShowContactModal(true);
    }
    setMobileOpen(false);
  }

  const allMobileItems = [
    ...PRIMARY_NAV,
    ...SECONDARY_NAV,
    ...ACTION_NAV,
  ];

  return (
    <>
      <header className="ft-navbar" role="banner">
        <div className="ft-navbar-inner">
          {/* Logo — left */}
          <FlashWordmark size="md" onClick={() => navigate("/")} />

          {/* Center nav — desktop */}
          <nav className="ft-nav-center" aria-label="Primary navigation">
            <ul className="ft-nav-links" role="list">
              {PRIMARY_NAV.map((item) => (
                <li key={item.path} role="none">
                  <NavLink
                    item={item}
                    isActive={isActive(item.path)}
                    onClick={() => setMobileOpen(false)}
                    className="ft-nav-link"
                  />
                </li>
              ))}
            </ul>
            <ul className="ft-nav-links" role="list">
              {SECONDARY_NAV.map((item) => (
                <li key={item.path} role="none">
                  <NavLink
                    item={item}
                    isActive={isActive(item.path)}
                    onClick={() => setMobileOpen(false)}
                    className="ft-nav-link"
                  />
                </li>
              ))}
            </ul>
          </nav>

          {/* Right actions — desktop */}
          <div className="ft-nav-actions">
            {ACTION_NAV.map((item) => (
              <NavLink
                key={item.path || item.action}
                item={item}
                isActive={item.path ? isActive(item.path) : false}
                onClick={(action) => {
                  if (action === "contact") setShowContactModal(true);
                }}
                className="ft-nav-action-btn"
              />
            ))}

            {isLoaded && (
              isSignedIn ? (
                <div className="ft-nav-user">
                  <UserButton afterSignOutUrl="/" />
                  <span className="ft-nav-username">{username}</span>
                </div>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button type="button" className="ft-nav-action-btn">Sign In</button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button type="button" className="ft-nav-action-btn ft-nav-action-btn--primary">Sign Up</button>
                  </SignUpButton>
                </>
              )
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className={`ft-nav-toggle${mobileOpen ? " ft-nav-toggle--open" : ""}`}
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="ft-mobile-nav"
          >
            <span className="ft-nav-toggle-lines" aria-hidden="true">
              <span className="ft-nav-toggle-line" />
              <span className="ft-nav-toggle-line" />
              <span className="ft-nav-toggle-line" />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <nav
        id="ft-mobile-nav"
        className={`ft-nav-mobile${mobileOpen ? " ft-nav-mobile--open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
      >
        <ul className="ft-nav-mobile-links" role="list">
          {allMobileItems.map((item, i) => (
            <li key={item.path || item.action} role="none">
              {i === PRIMARY_NAV.length && <div className="ft-nav-mobile-divider" aria-hidden="true" />}
              <NavLink
                item={item}
                isActive={item.path ? isActive(item.path) : false}
                onClick={handleMobileAction}
                className="ft-nav-mobile-link"
              />
            </li>
          ))}
        </ul>

        {isLoaded && (
          <div className="ft-nav-mobile-auth">
            {isSignedIn ? (
              <div className="ft-nav-user">
                <UserButton afterSignOutUrl="/" />
                <span className="ft-nav-username">{username}</span>
              </div>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button type="button" className="ft-nav-mobile-link">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button type="button" className="ft-nav-action-btn ft-nav-action-btn--primary" style={{ width: "100%", padding: "14px" }}>
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Contact modal */}
      {showContactModal && (
        <div
          className="contact-modal-overlay"
          onClick={() => setShowContactModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Contact Developers"
        >
          <ElectricBorder color="#cc1111" speed={1} chaos={0.12} borderRadius={16}>
            <div
              style={{
                background: "#1e1e2d",
                border: "1px solid rgba(255, 215, 0, 0.3)",
                borderRadius: "16px",
                padding: "32px",
                maxWidth: "480px",
                width: "100%",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                color: "#fff",
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
                    cursor: "pointer",
                  }}
                  aria-label="Close"
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
                    fontWeight: 600,
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
                    fontWeight: 600,
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
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </ElectricBorder>
        </div>
      )}
    </>
  );
}
