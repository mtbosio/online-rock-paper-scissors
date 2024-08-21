require("dotenv").config();
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const session = require("express-session");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

let matches = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("createMatch", (matchId) => {
    matches[matchId] = { players: [socket.id], moves: {} };
    socket.join(matchId);
    console.log("Match id from server is: ", matchId);
  });

  socket.on("joinMatch", (matchId) => {
    if (matches[matchId] && matches[matchId].players.length === 1) {
      matches[matchId].players.push(socket.id);
      socket.join(matchId);
      io.to(matchId).emit("startMatch");
    } else {
      console.log(`Match ${matchId} not found or full`);
    }
  });

  socket.on("playerMove", (move) => {
    const matchId = Object.keys(matches).find((id) =>
      matches[id].players.includes(socket.id)
    );
    if (matches[matchId]) {
      matches[matchId].moves[socket.id.toString()] = move;
      if (Object.keys(matches[matchId].moves).length === 2) {
        console.log("game has ended");
        const [player1, player2] = matches[matchId].players;
        const move1 = matches[matchId].moves[player1];
        const move2 = matches[matchId].moves[player2];

        let result;
        if (move1 === move2) {
          result = {
            message: "You have tied your opponent... do better.",
            opponentMove: move2,
          };
        } else if (
          (move1 === "Stone" && move2 === "Shears") ||
          (move1 === "Shears" && move2 === "Scroll") ||
          (move1 === "Scroll" && move2 === "Stone")
        ) {
          result = {
            message: "You have proved victorius... well done.",
            opponentMove: move2,
          };
        } else {
          result = {
            message: "You have lost... a great disservice.",
            opponentMove: move2,
          };
        }

        io.to(player1).emit("gameResult", result);
        io.to(player2).emit("gameResult", {
          message:
            result.message === "You win!"
              ? "You lose!"
              : result.message === "You lose!"
              ? "You win!"
              : result.message,
          opponentMove: move1,
        });

        // Reset the match for a new round or end the match
        delete matches[matchId].moves;
      }
    }
  });
});

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    req.session.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    res.status(200).send({ success: true, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(401).send({ success: false, message: "Authentication failed" });
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.status(200).send({ success: true });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
