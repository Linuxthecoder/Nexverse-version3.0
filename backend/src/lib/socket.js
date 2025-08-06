import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// Function to get online users
export function getOnlineUsers() {
  return Object.keys(userSocketMap);
}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Update lastSeen when user connects
  if (userId) {
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      const user = await User.findById(userId);
      if (user) {
        io.emit("user-online", { userId, fullName: user.fullName, profilePic: user.profilePic });
      }
    } catch (e) {}
  }

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // --- Typing Indicator ---
  socket.on("typing", async ({ to, from, isTyping = true }) => {
    const receiverSocketId = userSocketMap[to];
    if (receiverSocketId) {
      // Fetch sender info
      let senderUser = null;
      try {
        senderUser = await User.findById(from);
      } catch (e) {}
      io.to(receiverSocketId).emit("typing", {
        from,
        isTyping,
        senderName: senderUser?.fullName || "A user",
        senderProfilePic: senderUser?.profilePic || "/avatar.png"
      });
    }
  });

  // --- Message Delivered ---
  socket.on("delivered", ({ to, messageId }) => {
    const senderSocketId = userSocketMap[to];
    if (senderSocketId) {
      io.to(senderSocketId).emit("delivered", { messageId });
    }
  });

  // --- Message Seen ---
  socket.on("seen", ({ to, messageIds }) => {
    const senderSocketId = userSocketMap[to];
    if (senderSocketId) {
      io.to(senderSocketId).emit("seen", { messageIds });
    }
  });

  socket.on("disconnect", async () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    // Update lastSeen when user disconnects
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
        const user = await User.findById(userId);
        if (user) {
          io.emit("user-offline", { userId, fullName: user.fullName, profilePic: user.profilePic });
        }
      } catch (e) {}
    }
  });
});

export { io, app, server };
