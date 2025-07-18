import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { JWT_SECRET } from "../lib/config.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      console.warn("[protectRoute] No JWT cookie found. req.cookies:", req.cookies);
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.warn("[protectRoute] JWT verification failed:", err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token. Please log in again." });
      } else {
        return res.status(500).json({ message: "Token verification failed.", error: err.message });
      }
    }

    if (!decoded) {
      console.warn("[protectRoute] Decoded JWT is null or undefined.");
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.warn("[protectRoute] No user found for decoded.userId:", decoded.userId);
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("[protectRoute] Unexpected error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
