import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Solo from "./pages/Solo";
import Lobby from "./pages/Lobby";
import Race from "./pages/Race";
import Results from "./pages/Results";
import Online from "./pages/Online";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/solo" element={<Solo />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/online" element={<Online />} />
      <Route path="/race" element={<Race />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
