import "./App.css";
//import io from "socket.io-client";
import { useState, useEffect } from "react";
import Header from "./components/header/header";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
//const socket = io("http://localhost:5001");

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

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
          console.log(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  // log out function to log the user out of google and set the profile array to null
  const logOut = () => {
    googleLogout();
    setProfile(null);
  };

  /*const [playerMove, setPlayerMove] = useState(null);
  const [opponentMove, setOpponentMove] = useState(null);

  

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
  */
  return (
    <>
      <Header user={profile} login={login} logout={logOut} />
    </>
  );
}

export default App;
