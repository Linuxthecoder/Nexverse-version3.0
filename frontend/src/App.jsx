import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationPopup from "./components/NotificationPopup";
import { axiosInstance } from "./lib/axios";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Send the welcome image only once per user
  useEffect(() => {
    const ADMIN_ID = "687aab1488af9cf390e7c2b3";
    const IMAGE_URL = "/whatsnew.png";
    if (authUser && authUser._id !== ADMIN_ID) {
      const sentKey = `whatsnew-image-sent-${authUser._id}`;
      if (!localStorage.getItem(sentKey)) {
        axiosInstance.post(`/messages/send/${authUser._id}`, {
          text: "",
          image: IMAGE_URL,
          senderId: ADMIN_ID,
        }).then(() => {
          localStorage.setItem(sentKey, "true");
        }).catch(() => {});
      }
    }
  }, [authUser]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <ErrorBoundary>
      <div data-theme={theme}>
        <NotificationPopup />

        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>

        <Toaster />
      </div>
    </ErrorBoundary>
  );
};
export default App;
