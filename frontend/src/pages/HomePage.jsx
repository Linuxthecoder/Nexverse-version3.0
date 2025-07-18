import { useChatStore } from "../store/useChatStore";
import { useState } from "react";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useChatStore();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-base-200">
      <Navbar onHamburgerClick={() => setSidebarOpen(true)} />
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
            {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
