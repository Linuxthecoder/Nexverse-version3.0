import { useEffect } from "react";
import { useNotificationStore } from "../store/useNotificationStore";

const NotificationPopup = () => {
  const { notifications, removeNotification } = useNotificationStore();
  // Show up to 3 notifications at once
  const visible = notifications.slice(0, 3);

  useEffect(() => {
    if (visible.length > 0) {
      const timer = setTimeout(() => {
        removeNotification(visible[visible.length - 1].id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, removeNotification]);

  return (
    <div className="fixed z-50 bottom-6 right-6 flex flex-col gap-3 items-end">
      {visible.map((n) => (
        <div
          key={n.id}
          className="bg-base-100 border border-base-300 shadow-lg rounded-xl px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-xs animate-fade-in"
        >
          <div className="relative">
            {n.senderProfilePic && (
              <img
                src={n.senderProfilePic}
                alt={n.senderName || "User"}
                className="w-10 h-10 rounded-full object-cover border"
              />
            )}
            {n.dotColor && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${n.dotColor === "green" ? "bg-green-500" : "bg-red-500"}`}
                style={{ zIndex: 2 }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {n.senderName && (
              <div className="font-semibold text-primary truncate">{n.senderName}</div>
            )}
            <div className="text-base-content/80 truncate">{n.text}</div>
            <div className="text-xs text-zinc-400 mt-1">
              {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
          <button
            className="ml-2 text-zinc-400 hover:text-red-500"
            onClick={() => removeNotification(n.id)}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
export default NotificationPopup; 