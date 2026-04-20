import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <main className="page centered">
      <h1 className="app-title">FlashType</h1>
      <div className="button-stack">
        <button type="button" onClick={() => navigate("/solo")}>
          Solo Practice
        </button>
        <button type="button" onClick={() => navigate("/lobby")}>
          Play with Friends
        </button>
      </div>
    </main>
  );
}

export default Home;
