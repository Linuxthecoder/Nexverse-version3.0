import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Joi from "joi";
import createError from "http-errors";
import mongoose from "mongoose";

const sendMessageSchema = Joi.object({
  text: Joi.string().allow('').max(1000),
  image: Joi.string().allow('', null),
  video: Joi.string().allow('', null),
});

export const getUsersForSidebar = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    console.log("[getMessages] userToChatId:", userToChatId, "myId:", myId);
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      console.warn("[getMessages] Invalid userToChatId:", userToChatId);
      throw createError(400, "Invalid user ID. Please select a valid chat.");
    }
    if (!mongoose.Types.ObjectId.isValid(myId)) {
      console.warn("[getMessages] Invalid myId:", myId);
      throw createError(400, "Invalid session. Please log in again.");
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { error } = sendMessageSchema.validate(req.body);
    if (error) throw createError(400, "Please enter a message, image, or video.");
    const { text, image, video } = req.body;
    if (!text && !image && !video) {
      throw createError(400, "Please enter a message, image, or video.");
    }
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let videoUrl;
    if (video) {
      const uploadResponse = await cloudinary.uploader.upload(video, { resource_type: "video" });
      videoUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      video: videoUrl,
      read: false,
    });

    console.log("[sendMessage] Created new message with read:false", newMessage);

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    // Fetch sender info for notification
    const senderUser = await User.findById(senderId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        ...newMessage.toObject(),
        senderName: senderUser?.fullName || "A user",
        senderProfilePic: senderUser?.profilePic || "/avatar.png",
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

// Mark all messages from a specific user as read
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    console.log("[markMessagesAsRead] userToChatId:", userToChatId, "myId:", myId);
    if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
      console.warn("[markMessagesAsRead] Invalid userToChatId:", userToChatId);
      throw createError(400, "Invalid user ID. Please select a valid chat.");
    }
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: "Messages marked as read." });
  } catch (error) {
    next(error);
  }
};

// Get unread message counts per user
export const getUnreadCounts = async (req, res, next) => {
  try {
    console.log("[getUnreadCounts] req.user:", req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized. Please log in." });
    }
    const myId = req.user._id;
    try {
      console.log("[getUnreadCounts] Aggregating for myId:", myId);
      // Fix: always convert myId to string for ObjectId
      const myIdStr = typeof myId === 'string' ? myId : myId.toString();
      const counts = await Message.aggregate([
        { $match: { receiverId: mongoose.Types.ObjectId(myIdStr), read: false } },
        { $group: { _id: "$senderId", count: { $sum: 1 } } },
      ]);
      const result = {};
      counts.forEach((item) => {
        result[item._id] = item.count;
      });
      console.log("[getUnreadCounts] Result:", result);
      res.status(200).json(result);
    } catch (err) {
      console.warn("[getUnreadCounts] Aggregate failed for myId:", myId, err);
      res.status(200).json({});
    }
  } catch (error) {
    console.error("[getUnreadCounts] Unexpected error:", error);
    res.status(200).json({});
  }
};
