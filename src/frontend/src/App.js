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
  // logic flow:
  // 1. user connects to page but not signed in
  //    -- Sign in to get started!
  // 2. User signs in
  //    -- Create or join a match to play with friends!
  // 3a. User creates a match
  // 3b. User joins a match
  //    -- options for moves are shown
  // 4. User selects a move
  //    -- display waiting modal
  // 5. Opponent selects a move and the game ends.
  //    -- display result
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

  const reset = () => {
    setMatchID(null);
    setPlayerMove(null);
    setMatchStarted(null);
    setResult(null);
  };

  return (
    <>
      <Header
        user={profile}
        login={login}
        logout={logOut}
        createMatch={createMatch}
        joinMatch={joinMatch}
        matchStarted={matchStarted}
      />
      <main>
        {/* 1. User connects but is not signed in*/}
        {!user && <h2>Sign in to get started!</h2>}
        {/* 2. User signs in */}
        {user && (
          <>
            {/* Match has not been created yet */}
            {!matchStarted && !matchId && !result && (
              <div className="center">
                {/* 3a/3b. User hosts / joins a match */}
                <h2>
                  Click <b style={{ margin: "0 5px" }}>CREATE MATCH</b> to
                  receive a code to share with your friend.
                </h2>
                <h2>
                  <b>OR</b>
                </h2>
                <h2>
                  Click <b style={{ margin: "0 5px" }}>JOIN MATCH</b> to enter a
                  code to join.
                </h2>
              </div>
            )}
            {/* Match has been created but not joined */}
            {matchId && !matchStarted && !result && (
              <div className="center">
                <h2>Match Id: {matchId}</h2>
                <h2>Share this code with your friend to start the match!</h2>
              </div>
            )}
            {/* Match has started */}
            {matchStarted && (
              <>
                {/* Player has made a move */}
                {playerMove && (
                  <div className="center">
                    <h2>Waiting for opponent...</h2>
                  </div>
                )}
                {/* Player has not made a move */}
                {!playerMove && (
                  <div className="center">
                    <h2>Which do you choose?</h2>
                    <div className="options">
                      <button onClick={() => handleMove("Stone")}>
                        <img
                          src={require("./assets/images/stone.png")}
                          alt="Stone"
                        />
                      </button>
                      <button onClick={() => handleMove("Scroll")}>
                        <img
                          src={require("./assets/images/scroll.png")}
                          alt="Scroll"
                        />
                      </button>
                      <button onClick={() => handleMove("Shears")}>
                        <img
                          src={require("./assets/images/shears.png")}
                          alt="Shears"
                        />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Match is over and result is displayed */}
            {result && (
              <div className="resultContainer">
                <h2>{result.message}</h2>
                <div className="movePictureContainer">
                  <div className="movePicture">
                    <h2>You chose {playerMove}.</h2>
                    {playerMove === "Stone" && (
                      <div>
                        <img
                          src={require("./assets/images/stone.png")}
                          alt="Stone"
                        />
                      </div>
                    )}
                    {playerMove === "Scroll" && (
                      <div>
                        <img
                          src={require("./assets/images/scroll.png")}
                          alt="Scroll"
                        />
                      </div>
                    )}
                    {playerMove === "Shears" && (
                      <div>
                        <img
                          src={require("./assets/images/shears.png")}
                          alt="Shears"
                        />
                      </div>
                    )}
                  </div>
                  <div className="movePicture">
                    <h2>Your opponent chose {result.opponentMove}.</h2>
                    {result.opponentMove === "Stone" && (
                      <div>
                        <img
                          src={require("./assets/images/stone.png")}
                          alt="Stone"
                        />
                      </div>
                    )}
                    {result.opponentMove === "Scroll" && (
                      <div>
                        <img
                          src={require("./assets/images/scroll.png")}
                          alt="Scroll"
                        />
                      </div>
                    )}
                    {result.opponentMove === "Shears" && (
                      <div>
                        <img
                          src={require("./assets/images/shears.png")}
                          alt="Shears"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => reset()} className="reset">
                  Reset
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default App;
