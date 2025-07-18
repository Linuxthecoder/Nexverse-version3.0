import { create } from "zustand";

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({ notifications: [notification, ...state.notifications] })),
  removeNotification: (id) => set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  clearNotifications: () => set({ notifications: [] }),
}));
// Notification type: { id, text, type, timestamp, senderName?, senderProfilePic?, showPopup? } 