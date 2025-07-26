import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import "express-async-errors";
import helmet from "helmet";
import morgan from "morgan";
import { RateLimiterMemory } from "rate-limiter-flexible";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = 5001;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(morgan("dev"));

// Rate limiter: 100 requests per 15 minutes per IP
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 900, // 15 minutes
});
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (err) {
    res.status(429).json({ message: "Too many requests. Please try again later." });
  }
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.ipify.org"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        },
      },
    })
  );
  // Serve static files from the frontend build
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // For any route not handled by your API, serve index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found" });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  // User-friendly error messages
  if (status === 400) {
    message =
      message === "Invalid user ID. Please select a valid chat."
        ? "The selected chat could not be found. Please try another."
        : message.includes("validation") || message.includes("Validation")
        ? "Some information you entered is invalid. Please check and try again."
        : message;
  } else if (status === 401) {
    message = "You are not authorized. Please log in.";
  } else if (status === 403) {
    message = "You do not have permission to do this.";
  } else if (status === 404) {
    message = "The resource you are looking for was not found.";
  } else if (status === 409) {
    message = "This email is already registered. Please log in or use another email.";
  } else if (status === 429) {
    message = "You are sending requests too quickly. Please slow down.";
  } else if (status >= 500) {
    message = "Something went wrong on our end. Please try again later.";
  }

  res.status(status).json({
    message,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
