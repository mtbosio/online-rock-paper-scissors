const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the React app
app.use(express.static(path.join(__dirname, "../front/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../front/build", "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("playerMove", (move) => {
    socket.broadcast.emit("opponentMove", move);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
