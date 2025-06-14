
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("join", (id) => {
    socket.join(id); // Join room using 6-digit ID
  });

  socket.on("call", ({ to, from, offer }) => {
    io.to(to).emit("call", { from, offer, to });
  });

  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { candidate });
  });
});

server.listen(3000, () => {
  console.log("Signaling server running on port 3000");
});

