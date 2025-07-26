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
  typingUsers: {}, // { userId: boolean } - tracks who is typing

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
      // Add status to the message
      const messageWithStatus = { ...res.data, status: "sent" };
      set({ messages: [...messages, messageWithStatus] });
    } catch (error) {
      console.error("Error in sendMessage:", error);
      let message = error.response?.data?.message || error.message || "Failed to send message.";
      toast.error(message);
    }
  },

  // --- Typing Indicator ---
  setTypingIndicator: (userId, isTyping) => {
    set(state => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping
      }
    }));
  },

  // --- Message Status Updates ---
  updateMessageStatus: (messageId, status) => {
    set(state => ({
      messages: state.messages.map(message => 
        message._id === messageId 
          ? { ...message, status } 
          : message
      )
    }));
  },

  // --- Mark Messages as Seen ---
  markMessagesAsSeen: (senderId) => {
    const { messages, selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    
    if (!socket || !selectedUser || selectedUser._id !== senderId) return;

    // Find unread messages from this sender
    const unreadMessageIds = messages
      .filter(msg => msg.senderId === senderId && msg.receiverId === useAuthStore.getState().authUser._id && (!msg.status || msg.status === "sent"))
      .map(msg => msg._id);

    if (unreadMessageIds.length > 0) {
      // Update local status
      unreadMessageIds.forEach(messageId => {
        get().updateMessageStatus(messageId, "seen");
      });

      // Emit seen event
      socket.emit("seen", { 
        to: senderId, 
        messageIds: unreadMessageIds 
      });
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Add status to received message
      const messageWithStatus = { ...newMessage, status: "delivered" };
      set({
        messages: [...get().messages, messageWithStatus],
      });

      // Emit delivered event back to sender
      if (socket) {
        socket.emit("delivered", {
          to: newMessage.senderId,
          messageId: newMessage._id
        });
      }

      // Mark messages as seen when received in active chat
      get().markMessagesAsSeen(newMessage.senderId);
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
