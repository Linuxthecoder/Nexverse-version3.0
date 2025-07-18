import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useNotificationStore } from "./useNotificationStore";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.error("Error in checkAuth:", error);
      let message = error.response?.data?.message || error.message || "Failed to check authentication. Please try again.";
      toast.error(message);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.error("Error in signup:", error);
      let message = error.response?.data?.message || error.message || "Signup failed. Please try again.";
      toast.error(message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      console.error("Error in login:", error);
      let message = error.response?.data?.message || error.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.error("Error in logout:", error);
      let message = error.response?.data?.message || error.message || "Logout failed. Please try again.";
      toast.error(message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error in update profile:", error);
      let message = error.response?.data?.message || error.message || "Profile update failed. Please try again.";
      toast.error(message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    socket.on("user-online", (data) => {
      if (data.userId !== authUser._id) {
        useNotificationStore.getState().addNotification({
          id: `online-${data.userId}-${Date.now()}`,
          text: `is now online.`,
          type: "info",
          senderName: data.fullName,
          senderProfilePic: data.profilePic || "/avatar.png",
          dotColor: "green",
          timestamp: new Date().toISOString(),
        });
      }
    });
    socket.on("user-offline", (data) => {
      if (data.userId !== authUser._id) {
        useNotificationStore.getState().addNotification({
          id: `offline-${data.userId}-${Date.now()}`,
          text: `went offline.`,
          type: "info",
          senderName: data.fullName,
          senderProfilePic: data.profilePic || "/avatar.png",
          dotColor: "red",
          timestamp: new Date().toISOString(),
        });
      }
    });
    socket.on("newMessage", (msg) => {
      if (msg.senderId !== authUser._id) {
        useNotificationStore.getState().addNotification({
          id: `msg-${msg._id}`,
          text: `sent you a message.`,
          type: "message",
          senderName: msg.senderName || msg.senderFullName || "A user",
          senderProfilePic: msg.senderProfilePic || "/avatar.png",
          dotColor: "green",
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on("connect_error", (err) => {
      toast.error("Socket connection error. Please check your network.");
      console.error("Socket connect_error:", err);
    });
    socket.on("disconnect", (reason) => {
      toast.error("Disconnected from chat server. Attempting to reconnect...");
      console.warn("Socket disconnected:", reason);
    });
    socket.io.on("reconnect", (attempt) => {
      toast.success("Reconnected to chat server.");
      console.info("Socket reconnected after attempts:", attempt);
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
