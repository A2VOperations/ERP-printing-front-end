"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../../lib/apiConfig";

// Safe JSON parser helper to prevent "Unexpected token < in JSON" when server returns HTML errors
const safeFetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`,
    );
  }
  return await res.json();
};

export default function ChatView({ user, onUnreadCountChange }) {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef(null);

  const userId = user?.id || user?._id || user?.email || "";
  const userRole = user?.role || "employee";
  const isAdmin = userRole === "admin" || userRole === "manager";

  // Auto-scroll message container to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch available contacts
  const fetchContacts = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await safeFetchJson(`${API_BASE_URL}/api/chat/contacts`, {
        headers: {
          "x-user-id": userId,
          "x-user-role": userRole,
        },
      });
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      // Silence network polling notices
    }
  }, [userId, userRole]);

  // Fetch conversations summary & unread counts
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await safeFetchJson(
        `${API_BASE_URL}/api/chat/conversations`,
        {
          headers: {
            "x-user-id": userId,
            "x-user-role": userRole,
          },
        },
      );
      if (data.success) {
        setConversations(data.conversations || []);
        const totalUnread = (data.conversations || []).reduce(
          (acc, c) => acc + (c.unreadCount || 0),
          0,
        );
        if (onUnreadCountChange) onUnreadCountChange(totalUnread);
      }
    } catch (err) {
      // Silence network polling notices
    }
  }, [userId, userRole, onUnreadCountChange]);

  // Fetch messages thread for selected contact
  const fetchMessages = useCallback(
    async (contactId, silent = false) => {
      if (!userId || !contactId) return;
      if (!silent) setLoading(true);
      try {
        const data = await safeFetchJson(
          `${API_BASE_URL}/api/chat/messages/${contactId}`,
          {
            headers: {
              "x-user-id": userId,
              "x-user-role": userRole,
            },
          },
        );
        if (data.success) {
          setMessages(data.messages || []);
          if (data.targetUser) {
            setSelectedContact((prev) => ({
              ...(prev || {}),
              ...data.targetUser,
            }));
          }
        }
      } catch (err) {
        // Silence network polling notices
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [userId, userRole],
  );

  // Initial load
  useEffect(() => {
    if (userId) {
      fetchContacts();
      fetchConversations();
    }
  }, [userId, fetchContacts, fetchConversations]);

  // Periodic polling every 3 seconds for live message updates
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetchConversations();
      fetchContacts();
      if (selectedContact?._id) {
        fetchMessages(selectedContact._id, true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [
    userId,
    selectedContact,
    fetchConversations,
    fetchContacts,
    fetchMessages,
  ]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setErrorMessage("");
    fetchMessages(contact._id, false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedContact || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setSending(true);
    setErrorMessage("");

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderId: userId,
      receiverId: selectedContact._id,
      message: messageText,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const data = await safeFetchJson(`${API_BASE_URL}/api/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
          "x-user-role": userRole,
        },
        body: JSON.stringify({
          receiverId: selectedContact._id,
          message: messageText,
        }),
      });

      if (data.success) {
        // Replace temp message with server response
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? data.message : m)),
        );
        fetchConversations();
      } else {
        // Revert optimistic update and display error
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setErrorMessage(data.error || "Failed to send message.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setErrorMessage(
        err.message || "Network error: Could not reach backend server.",
      );
    } finally {
      setSending(false);
    }
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.role || "").toLowerCase().includes(q)
    );
  });

  // Get unread count for a given contact ID
  const getContactUnread = (contactId) => {
    const conv = conversations.find((c) => c.contact?._id === contactId);
    return conv?.unreadCount || 0;
  };

  // Get last message info for contact ID
  const getContactLastMessage = (contactId) => {
    const conv = conversations.find((c) => c.contact?._id === contactId);
    return conv?.lastMessage || null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-7xl mx-auto bg-white rounded-md shadow-xl border border-slate-200 overflow-hidden font-sans">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide uppercase flex items-center gap-2">
              Internal Chat Console
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isAdmin
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                }`}
              >
                {isAdmin ? "Admin Channel" : "Employee Support Channel"}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {isAdmin
                ? "Direct messaging active across employees & administration staff."
                : "Direct line to Admins & Management. (Employee-to-Employee chat disabled)"}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Notice: Only Admin & Manager contacts are available</span>
          </div>
        )}
      </div>

      {/* Main Grid View */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Contact & Conversation Navigation */}
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder={
                  isAdmin
                    ? "Search employees & admins..."
                    : "Search admins & managers..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <svg
                  className="w-10 h-10 mx-auto text-slate-300 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-xs font-bold text-slate-600">
                  No contacts found
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {!isAdmin
                    ? "No administrative accounts active right now."
                    : "No matching contacts."}
                </p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact?._id === contact._id;
                const unreadCount = getContactUnread(contact._id);
                const lastMsg = getContactLastMessage(contact._id);
                const isContactAdmin =
                  contact.role === "admin" || contact.role === "manager";

                return (
                  <button
                    key={contact._id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer relative group ${
                      isSelected
                        ? "bg-sky-50/80 border-l-4 border-sky-500"
                        : "hover:bg-slate-100/60"
                    }`}
                  >
                    {/* User Avatar & Online Badge */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold uppercase shadow-xs ${
                          isContactAdmin
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-sky-100 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {(contact.name || "U").substring(0, 2)}
                      </div>
                      <span
                        className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white ${
                          contact.isOnline
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-slate-300"
                        }`}
                        title={contact.isOnline ? "Online Now" : "Offline"}
                      />
                    </div>

                    {/* Contact Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-sky-900" : "text-slate-800"
                          }`}
                        >
                          {contact.name}
                        </span>
                        {lastMsg?.createdAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 truncate block">
                          {lastMsg ? lastMsg.message : contact.email}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isContactAdmin
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {contact.role || "Employee"}
                          </span>
                          {unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-black h-4 px-1.5 rounded-full flex items-center justify-center animate-bounce">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Thread */}
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {selectedContact ? (
            <>
              {/* Active Conversation Header */}
              <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold uppercase ${
                        selectedContact.role === "admin" ||
                        selectedContact.role === "manager"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : "bg-sky-100 text-sky-700 border border-sky-200"
                      }`}
                    >
                      {(selectedContact.name || "U").substring(0, 2)}
                    </div>
                    <span
                      className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white ${
                        selectedContact.isOnline
                          ? "bg-emerald-500"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-extrabold text-slate-800">
                        {selectedContact.name}
                      </h2>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          selectedContact.role === "admin" ||
                          selectedContact.role === "manager"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {selectedContact.role || "Employee"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {selectedContact.isOnline
                        ? "Active now"
                        : selectedContact.lastActiveAt
                          ? `Last active ${new Date(
                              selectedContact.lastActiveAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : selectedContact.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Banner if restricted */}
              {errorMessage && (
                <div className="bg-rose-50 border-b border-rose-200 text-rose-700 text-xs px-4 py-2 flex justify-between items-center animate-fade-in">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-rose-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => setErrorMessage("")}
                    className="text-rose-500 hover:text-rose-700 font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Messages Thread Container */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {loading ? (
                  <div className="flex justify-center items-center h-full text-slate-400 gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-sky-500"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-xs font-semibold">
                      Loading conversation...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      No messages yet
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Start the conversation by sending a message below.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const myIds = [user?.id, user?._id, user?.email]
                      .filter(Boolean)
                      .map((id) => String(id).toLowerCase());
                    const targetIds = [
                      selectedContact?._id,
                      selectedContact?._id,
                      selectedContact?.id,
                      selectedContact?.email,
                    ]
                      .filter(Boolean)
                      .map((id) => String(id).toLowerCase());

                    const msgSenderId = String(
                      msg.senderId || "",
                    ).toLowerCase();

                    const isMe =
                      myIds.includes(msgSenderId) ||
                      (!targetIds.includes(msgSenderId) && msgSenderId !== "");

                    return (
                      <div
                        key={msg._id || msg.createdAt || Math.random()}
                        className={`w-full flex flex-col ${
                          isMe
                            ? "items-end text-right"
                            : "items-start text-left"
                        }`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md md:max-w-lg px-4 py-2.5 rounded-md text-xs leading-relaxed shadow-sm transition-all ${
                            isMe
                              ? "bg-linear-to-r from-blue-600 via-sky-600 to-indigo-600 text-white rounded-tr-xs border border-sky-400/30"
                              : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                          }`}
                        >
                          <p className="whitespace-pre-wrap wrap-break-word font-medium">
                            {msg.message}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 mt-1 px-1 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <span className="text-[9px] font-semibold text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMe && (
                            <span className="text-[10px] text-sky-500 font-black">
                              {msg.read ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Message Input Controls */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder={`Write a message to ${selectedContact.name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 bg-slate-100/90 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
                >
                  {sending ? (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <>
                      <span>Send</span>
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Unselected Empty State */
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                <svg
                  className="w-8 h-8 text-sky-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-extrabold text-slate-700">
                Select a Contact to Start Chatting
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {!isAdmin
                  ? "Choose an Administrator or Manager from the left contact list to initiate a private support chat."
                  : "Select any team member or employee from the contact list on the left to start a conversation."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
