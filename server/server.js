import express from "express";
import { Server as SocketServer } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: "http://localhost:5173" },
});

io.on("connection", (socket) => {
  console.log("Cliente conectado");

  socket.on("newMessage", (data) => {
    console.log("Nuevo mensaje:", data);
    socket.broadcast.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});

server.listen(4000);
console.log("server on port:" + 4000);
