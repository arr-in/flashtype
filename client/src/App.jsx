import { Navigate, Route, Routes } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import Home from "./pages/Home";
import Solo from "./pages/Solo";
import Lobby from "./pages/Lobby";
import Race from "./pages/Race";
import Results from "./pages/Results";
import Online from "./pages/Online";
import Leaderboard from "./pages/Leaderboard";
import Stats from "./pages/Stats";
import Navbar from "./components/Navbar";
import ElectricBorder from "./components/ElectricBorder";

function App() {
  return (
    <>
      <Navbar />
      <div className="ft-page-offset">
      <Routes>
        {/* Public routes — all accessible to guests & signed-in users */}
        <Route path="/"           element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/solo"       element={<Solo />} />
        <Route path="/lobby"      element={<Lobby />} />
        <Route path="/online"     element={<Online />} />
        <Route path="/race"       element={<Race />} />
        <Route path="/results"    element={<Results />} />
        <Route path="/stats"      element={<Stats />} />

        {/* Clerk auth routes */}
        <Route
          path="/sign-in/*"
          element={
            <div className="clerk-auth-page">
              <ElectricBorder color="#cc1111" speed={1} chaos={0.12} borderRadius={24}>
                <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/" />
              </ElectricBorder>
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="clerk-auth-page">
              <ElectricBorder color="#cc1111" speed={1} chaos={0.12} borderRadius={24}>
                <SignUp routing="path" path="/sign-up" fallbackRedirectUrl="/" />
              </ElectricBorder>
            </div>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </>
  );
}

export default App;
