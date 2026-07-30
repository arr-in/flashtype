import { Navigate, Route, Routes } from "react-router-dom";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import Home from "./pages/Home";
import Solo from "./pages/Solo";
import Lobby from "./pages/Lobby";
import Race from "./pages/Race";
import Results from "./pages/Results";
import Online from "./pages/Online";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";

/**
 * Wraps a route so it redirects to /sign-in if the user is not signed in.
 * If Clerk is not configured (no publishable key), renders children directly.
 */
function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  // While Clerk loads, render nothing to avoid flash
  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      {/* Clerk auth routes — Clerk's built-in UI */}
      <Route
        path="/sign-in/*"
        element={
          <div className="clerk-auth-page">
            <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/" />
          </div>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <div className="clerk-auth-page">
            <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/" />
          </div>
        }
      />

      {/* Protected routes — require sign-in */}
      <Route path="/solo" element={<Solo />} />
      <Route path="/results" element={<Results />} />
      <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
      <Route path="/online" element={<ProtectedRoute><Online /></ProtectedRoute>} />
      <Route path="/race" element={<ProtectedRoute><Race /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
