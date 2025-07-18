import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isError: false,
  error: null,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.error("Error in getUsers:", error);
      let message = error.response?.data?.message || error.message || "Failed to load users.";
      toast.error(message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    if (!userId || typeof userId !== 'string' || userId.length !== 24 || userId === 'unread-counts') {
      console.warn("[getMessages] HARD RETURN: invalid userId", userId);
      return;
    }
    console.log("[getMessages] Called with userId:", userId);
    set({ isMessagesLoading: true, isError: false, error: null });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data, isError: false, error: null });
    } catch (error) {
      console.error("Error in getMessages:", error);
      let message = error.response?.data?.message || error.message || "Failed to load messages.";
      toast.error(message);
      set({ isError: true, error: message });
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      let message = error.response?.data?.message || error.message || "Failed to send message.";
      toast.error(message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: async (selectedUser) => {
    if (!selectedUser || !selectedUser._id || typeof selectedUser._id !== "string" || selectedUser._id.length !== 24 || selectedUser._id === "unread-counts") {
      console.warn("[setSelectedUser] HARD RETURN: invalid selectedUser._id", selectedUser && selectedUser._id);
      set({ selectedUser: null });
      return;
    }
    console.log("[setSelectedUser] Called with:", selectedUser);
    set({ selectedUser });
  },
}));
