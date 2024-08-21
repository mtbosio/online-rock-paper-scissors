import "./App.css";
import io from "socket.io-client";
import { useState, useEffect } from "react";
import Header from "./components/header/header";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  withCredentials: true,
});
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [matchStarted, setMatchStarted] = useState(null);
  const [result, setResult] = useState(null);
  const [playerMove, setPlayerMove] = useState(null);
  const [matchId, setMatchID] = useState(null);
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log("Login Failed:", error),
  });

  useEffect(() => {
    if (user) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
          {
            headers: {
              Authorization: `Bearer ${user.access_token}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  useEffect(() => {
    socket.on("startMatch", () => {
      setMatchStarted(true);
      setResult(null);
    });

    socket.on("gameResult", (res) => {
      setResult(res);
      setMatchStarted(false);
    });

    return () => {
      socket.off("startMatch");
      socket.off("gameResult");
    };
  }, []);

  // log out function to log the user out of google and set the profile array to null
  const logOut = () => {
    googleLogout();
    setProfile(null);
  };

  const createMatch = () => {
    const id = Math.random().toString(36).substring(7);
    setMatchID(id);
    console.log(matchId);
    socket.emit("createMatch", id);
  };

  const joinMatch = () => {
    const matchId = prompt("Enter Match ID:");
    socket.emit("joinMatch", matchId);
  };

  const handleMove = (move) => {
    setPlayerMove(move);
    socket.emit("playerMove", move);
  };

  return (
    <>
      <Header
        user={profile}
        login={login}
        logout={logOut}
        createMatch={createMatch}
        joinMatch={joinMatch}
      />
      {matchId ? <h2 className="center">Match Id: {matchId}</h2> : <></>}
      {matchStarted && !playerMove ? (
        <div className="center">
          <button onClick={() => handleMove("Stone")}>Stone</button>
          <button onClick={() => handleMove("Scroll")}>Scroll</button>
          <button onClick={() => handleMove("Shears")}>Shears</button>
        </div>
      ) : (
        <h2 className="center">
          Host a game and share the code with your friend to start!
        </h2>
      )}
      {result ? <h2 className="center">{result.message}</h2> : <></>}
    </>
  );
}

export default App;
