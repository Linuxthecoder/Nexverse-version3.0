import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, User, Bell, Menu } from "lucide-react";
import { useState } from "react";
import { useNotificationStore } from "../store/useNotificationStore";

const Navbar = ({ onHamburgerClick }) => {
  const { logout, authUser } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const clearNotifications = useNotificationStore((s) => s.clearNotifications);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="sm:hidden flex items-center gap-2 px-2 py-1 rounded hover:bg-base-200 transition-all"
              aria-label="Go to main page"
              style={{ textDecoration: 'none' }}
            >
              <Menu className="w-6 h-6" />
              <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <span className="text-base font-bold">NexVerse</span>
            </Link>
            <Link to="/" className="hidden sm:flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">NexVerse</h1>
            </Link>
          </div>
          

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                className="btn btn-ghost btn-circle"
                onClick={() => setShowDropdown((v) => !v)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-base">Notifications</span>
                      {notifications.length > 0 && (
                        <button
                          className="text-xs text-red-500 hover:underline"
                          onClick={clearNotifications}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center text-zinc-400 py-4">No new notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          to={n.link || "/"}
                          className="block px-3 py-2 hover:bg-base-200 rounded transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          {n.text}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Link
              to={"/settings"}
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
