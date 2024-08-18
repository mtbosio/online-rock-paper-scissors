import "./App.css";
import io from "socket.io-client";
import { useState, useEffect } from "react";
import Header from "./components/header/header";
import { GoogleOAuthProvider } from "@react-oauth/google";
const socket = io("http://localhost:5001");

function App() {
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user"));
  });
  const [playerMove, setPlayerMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);

  const handleLogout = () => {
    fetch(`${process.env.BACKEND_URL}/auth/logout`)
      .then(() => {
        localStorage.removeItem("user");
        setUser(null);
      })
      .catch((error) => console.error("Logout Error:", error));
  };

  const handleLoginSuccess = (response) => {
    fetch(`${process.env.BACKEND_URL}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential }),
    })
      .then((res) => {
        res.json();
      })
      .then((data) => {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      })
      .catch((error) => console.log("Login Error: ", error));
  };

  useEffect(() => {
    socket.on("opponentMove", (move) => {
      setOpponentMove(move);
    });
    return;
  }, []);

  const handleMove = (move) => {
    setPlayerMove(move);
    socket.emit("playerMove", move);
  };

  return (
    <GoogleOAuthProvider clientId={process.env.GOOGLE_AUTH.CLIENT_ID}>
      <Header
        user={user}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />
      {/*<div>
        <button onClick={() => handleMove("rock")}>Rock</button>
        <button onClick={() => handleMove("paper")}>Paper</button>
        <button onClick={() => handleMove("scissors")}>Scissors</button>
        <div>
          <p>Your move: {playerMove}</p>
          <p>Opponent's move: {opponentMove}</p>
        </div>
      </div>*/}
    </GoogleOAuthProvider>
  );
}

export default App;
