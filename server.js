const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*"
  }
});

io.on("connection", socket => {
  socket.on("offer", data => socket.broadcast.emit("offer", data));
  socket.on("answer", data => socket.broadcast.emit("answer", data));
  socket.on("ice-candidate", data => socket.broadcast.emit("ice-candidate", data));
});

server.listen(3000, () => console.log("Signaling server running on http://localhost:3000"));
