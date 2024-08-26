require("dotenv").config();
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
const { MongoClient, ServerApiVersion } = require("mongodb");
const axios = require("axios");

const uri = process.env.MONGODB_URI; // MongoDB connection string
const dbClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDb() {
  try {
    if (!dbClient.topology || !dbClient.topology.isConnected()) {
      await dbClient.connect();
      console.log("Connected to MongoDB!");
    }
    db = dbClient.db("rock-paper-scissors-db");
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Ensure the database connection is established before the app starts
(async () => {
  try {
    const db = await connectDb();
    const testCollection = db.collection("users");
    const testDoc = await testCollection.findOne({});
    console.log("Test query result:", testDoc);
  } catch (error) {
    console.error("Test query error:", error);
  }
})();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

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

async function updatePlayerStats(googleId, won) {
  const players = db.collection("users");

  const updateDoc = won
    ? { $inc: { wins: 1, matchesPlayed: 1 } }
    : { $inc: { matchesPlayed: 1 } };

  await players.updateOne({ googleId: googleId }, updateDoc);
}

let matches = {};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });

  socket.on("createMatch", (matchId, googleId) => {
    matches[matchId] = {
      players: [{ socketId: socket.id, googleId }],
      moves: {},
    };
    socket.join(matchId);
    console.log("Match id from server is: ", matchId);
  });

  socket.on("joinMatch", (matchId, googleId) => {
    if (matches[matchId] && matches[matchId].players.length === 1) {
      matches[matchId].players.push({ socketId: socket.id, googleId });
      socket.join(matchId);
      io.to(matchId).emit("startMatch");
    } else {
      console.log(`Match ${matchId} not found or full`);
    }
  });

  socket.on("playerMove", async (move) => {
    const matchId = Object.keys(matches).find((id) =>
      matches[id].players.some((player) => player.socketId === socket.id)
    );
    if (matches[matchId]) {
      matches[matchId].moves[socket.id] = move;
      if (Object.keys(matches[matchId].moves).length === 2) {
        console.log("Game has ended");
        const [player1, player2] = matches[matchId].players;
        const move1 = matches[matchId].moves[player1.socketId];
        const move2 = matches[matchId].moves[player2.socketId];

        let result;
        let winnerGoogleId = null;
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
            message: "You have proved victorious... well done.",
            opponentMove: move2,
          };
          winnerGoogleId = player1.googleId;
        } else {
          result = {
            message: "You have lost... a great disservice.",
            opponentMove: move2,
          };
          winnerGoogleId = player2.googleId;
        }

        io.to(player1.socketId).emit("gameResult", result);
        io.to(player2.socketId).emit("gameResult", {
          message:
            result.message === "You have proved victorious... well done."
              ? "You have lost... a great disservice."
              : result.message,
          opponentMove: move1,
        });

        // Update the match stats in MongoDB
        await updatePlayerStats(
          player1.googleId,
          winnerGoogleId === player1.googleId
        );
        await updatePlayerStats(
          player2.googleId,
          winnerGoogleId === player2.googleId
        );

        // Reset the match for a new round or end the match
        delete matches[matchId].moves;
      }
    }
  });
});

app.post("/auth/google", async (req, res) => {
  const { accessToken } = req.body; // Get the access token from the frontend

  try {
    // Fetch user information from Google using the access token
    const { data: userInfo } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const { sub, email, name } = userInfo;

    // Check if the user already exists in the database
    const userCollection = db.collection("users");
    const existingUser = await userCollection.findOne({ email: email });

    if (!existingUser) {
      await userCollection.insertOne({
        googleId: sub,
        email: email,
        name: name,
        matchesPlayed: 0,
        wins: 0,
      });
    }

    // Set the session user or send back the user data
    req.session.user = userInfo;
    res.status(200).send({ success: true, user: req.session.user });
  } catch (error) {
    console.error("Error during Google authentication:", error);
    res.status(500).send({ success: false, message: "Authentication failed" });
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.status(200).send({ success: true });
});

app.get("/user-stats/:googleId", async (req, res) => {
  const googleId = req.params.googleId;

  try {
    const players = db.collection("users");
    const userStats = await players.findOne({ googleId: googleId });
    console.log(userStats);
    if (userStats) {
      res.json(userStats);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
process.on("SIGINT", async () => {
  await dbClient.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});
