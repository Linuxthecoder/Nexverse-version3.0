import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { useState } from "react";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    isError,
    error,
    typingUsers,
    markMessagesAsSeen,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (
      !selectedUser ||
      !selectedUser._id ||
      typeof selectedUser._id !== 'string' ||
      selectedUser._id.length !== 24 ||
      selectedUser._id === 'unread-counts'
    ) {
      console.warn('[ChatContainer] HARD RETURN: invalid selectedUser._id', selectedUser && selectedUser._id);
      return;
    }
    console.log("[ChatContainer] selectedUser:", selectedUser);
    getMessages(selectedUser._id).catch(() => {});

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as seen when chat is opened
  useEffect(() => {
    if (selectedUser?._id && messages.length > 0) {
      markMessagesAsSeen(selectedUser._id);
    }
  }, [selectedUser?._id, messages, markMessagesAsSeen]);

  // Helper function to get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return "✓";
      case "delivered":
        return "✓✓";
      case "seen":
        return "✓✓";
      default:
        return "";
    }
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "sent":
        return "text-gray-400";
      case "delivered":
        return "text-gray-400";
      case "seen":
        return "text-blue-500";
      default:
        return "text-gray-400";
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-base-200">
        <ChatHeader />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load messages.</p>
          <p className="text-gray-500 mb-4">{error || "Please try again later or check your connection."}</p>
          {selectedUser && selectedUser._id && typeof selectedUser._id === 'string' && selectedUser._id.length === 24 && (
            <button className="btn btn-primary" onClick={() => getMessages(selectedUser._id)}>
              Retry
            </button>
          )}
        </div>
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className=" chat-image avatar">
              <div className="size-8 sm:size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col max-w-[80vw] sm:max-w-[400px]">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="max-w-[60vw] sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p className="break-words text-sm sm:text-base">{message.text}</p>}
              {/* Message Status Indicator */}
              {message.senderId === authUser._id && message.status && (
                <div className={`text-xs mt-1 ${getStatusColor(message.status)}`}>
                  {getStatusIcon(message.status)}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {typingUsers[selectedUser?._id] && (
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="size-8 sm:size-10 rounded-full border">
                <img
                  src={selectedUser.profilePic || "/avatar.png"}
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-bubble bg-gray-100 text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                </div>
                <span className="text-xs ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
