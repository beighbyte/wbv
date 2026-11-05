"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Conversation, ProcessingState } from "@/types/chat";
import { extractAndProcessFiles } from "@/lib/zip/extract";
import { blobManager } from "@/lib/storage/blob-manager";
import { mediaRegistry } from "@/lib/storage/media-registry";
import { chatCache } from "@/lib/storage/chat-cache";
import { parseChatTranscript } from "@/lib/parser/parse-chat";
import { createDemoConversations } from "@/lib/demo/sample-data";

import { DropZone } from "@/components/landing/DropZone";
import { ChatListHeader } from "@/components/chat-list/ChatListHeader";
import { ChatListItem } from "@/components/chat-list/ChatListItem";
import { ChatHeader } from "@/components/chat-room/ChatHeader";
import { MessageVirtualList } from "@/components/chat-room/MessageVirtualList";
import { ImageViewerModal } from "@/components/media/ImageViewerModal";
import { MessageSquare, ShieldCheck, Lock } from "lucide-react";

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatListSearch, setChatListSearch] = useState("");
  const [inChatSearch, setInChatSearch] = useState("");
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);

  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);
  const [chatVersion, setChatVersion] = useState(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef<number>(0);

  // Open Chat with history push on mobile (< 768px)
  const handleOpenChat = (id: string) => {
    setActiveChatId(id);
    setInChatSearch("");
    setInChatSearchOpen(false);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      window.history.pushState({ view: "chat", chatId: id }, "");
    }
  };

  // Close Chat (sync with browser history stack)
  const handleCloseChat = () => {
    if (typeof window !== "undefined" && window.history.state?.view === "chat") {
      window.history.back();
    } else {
      setActiveChatId(null);
    }
  };

  // Open preview image with history push
  const handleOpenPreviewImage = (url: string, filename: string) => {
    setPreviewImage({ url, filename });
    if (typeof window !== "undefined") {
      window.history.pushState({ view: "preview" }, "");
    }
  };

  // Close preview image
  const handleClosePreviewImage = () => {
    if (typeof window !== "undefined" && window.history.state?.view === "preview") {
      window.history.back();
    } else {
      setPreviewImage(null);
    }
  };

  // Handle hardware / gesture back button navigation
  useEffect(() => {
    if (conversations.length === 0) return;

    // Ensure baseline history state for the chat list
    if (typeof window !== "undefined" && !window.history.state?.view) {
      window.history.replaceState({ view: "chatlist" }, "");
    }

    const handlePopState = () => {
      // 1. If photo preview is open, close preview first
      if (previewImage) {
        setPreviewImage(null);
        return;
      }

      // 2. If chat is open on mobile, return to chat list
      if (activeChatId) {
        setActiveChatId(null);
        return;
      }

      // 3. If already on the chat list, prevent accidental website exit
      const now = Date.now();
      if (now - lastBackPressRef.current < 2500) {
        // Second press within 2.5s -> allow native exit
        window.history.back();
      } else {
        // First press -> keep user on chat list, show reminder toast
        lastBackPressRef.current = now;
        window.history.pushState({ view: "chatlist" }, "");
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2500);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [conversations.length, activeChatId, previewImage]);

  // Prevent accidental tab closure / refresh when session is active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (conversations.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [conversations.length]);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    stage: "idle",
    progress: 0,
    message: "",
    totalFiles: 0,
    processedFiles: 0,
    chatCount: 0,
  });

  const handleFilesSelected = async (files: File[] | FileList) => {
    try {
      const chats = await extractAndProcessFiles(files, (state) => {
        setProcessingState(state);
      });

      if (chats.length > 0) {
        setConversations(chats);
        // On desktop, auto-open the first chat in the dual pane. On mobile, stay on chat list so user chooses.
        const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
        setActiveChatId(isDesktop ? chats[0].id : null);
      } else {
        setProcessingState((prev) => ({
          ...prev,
          stage: "error",
          error:
            prev.error ||
            "No WhatsApp chats found. Please select a valid WhatsApp exported .zip archive or backup folder.",
        }));
      }
    } catch (err) {
      console.error("Error processing backup files:", err);
      setProcessingState((prev) => ({
        ...prev,
        stage: "error",
        error: "Failed to read backup files. Please make sure the zip is valid.",
      }));
    }
  };

  const handleLoadDemo = () => {
    const demos = createDemoConversations();
    demos.forEach((d) => {
      if (d.messages && d.messages.length > 0) {
        chatCache.set(d.id, d.messages);
      }
    });
    setConversations(demos);
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    setActiveChatId(isDesktop ? demos[0].id : null);
  };

  const handleReset = () => {
    chatCache.clear();
    mediaRegistry.clear();
    blobManager.revokeAll();
    setConversations([]);
    setActiveChatId(null);
    setChatVersion(0);
    setChatListSearch("");
    setInChatSearch("");
    setInChatSearchOpen(false);
    setProcessingState({
      stage: "idle",
      progress: 0,
      message: "",
      totalFiles: 0,
      processedFiles: 0,
      chatCount: 0,
    });
  };

  const handleSwapSides = (chatId: string) => {
    const currentMsgs = chatCache.get(chatId) || [];
    if (currentMsgs.length > 0) {
      const updated = currentMsgs.map((m) => {
        if (!m.sender || m.system) return m;
        return {
          ...m,
          direction: (m.direction === "out" ? "in" : "out") as "in" | "out",
        };
      });
      chatCache.set(chatId, updated);
      setChatVersion((v) => v + 1);
    } else {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          const updated = c.messages.map((m) => {
            if (!m.sender || m.system) return m;
            return {
              ...m,
              direction: (m.direction === "out" ? "in" : "out") as "in" | "out",
            };
          });
          return { ...c, messages: updated };
        })
      );
    }
  };

  const handleSelectParticipantPerspective = (chatId: string, senderName: string) => {
    if (senderName && typeof window !== "undefined") {
      try {
        localStorage.setItem("wbv_user_identity", senderName);
      } catch {}
    }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        return { ...c, myName: senderName || null };
      })
    );

    const targetChat = conversations.find((c) => c.id === chatId);
    if (targetChat?.rawText) {
      const parsed = parseChatTranscript(
        targetChat.rawText,
        targetChat.fileName,
        {},
        senderName
      );
      if (parsed) {
        chatCache.set(chatId, parsed.messages);
      }
    } else {
      const currentMsgs = chatCache.get(chatId) || [];
      const updated = currentMsgs.map((m) => {
        if (!m.sender || m.system) return m;
        const isMe = Boolean(senderName && m.sender.toLowerCase() === senderName.toLowerCase());
        return {
          ...m,
          direction: (isMe ? "out" : "in") as "in" | "out",
        };
      });
      chatCache.set(chatId, updated);
    }
    setChatVersion((v) => v + 1);
  };

  const rawActiveConversation = useMemo(
    () => conversations.find((c) => c.id === activeChatId) || null,
    [conversations, activeChatId]
  );

  const activeConversation = useMemo(() => {
    if (!rawActiveConversation) return null;

    // If already has messages populated in object (e.g. demo chat), return directly
    if (rawActiveConversation.messages && rawActiveConversation.messages.length > 0) {
      return rawActiveConversation;
    }

    // Resolve on-demand from LRU cache or parse from raw text in < 50ms
    const messages = chatCache.getOrParse(
      rawActiveConversation.id,
      rawActiveConversation.rawText || "",
      rawActiveConversation.fileName,
      rawActiveConversation.myName
    );

    return {
      ...rawActiveConversation,
      messages,
    };
  }, [rawActiveConversation, chatVersion]);

  const filteredConversations = conversations.filter((c) => {
    if (!chatListSearch) return true;
    const q = chatListSearch.toLowerCase();
    return (
      c.contactName.toLowerCase().includes(q) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(q))
    );
  });

  // SCREEN 1: Landing / DropZone
  if (conversations.length === 0) {
    return (
      <main className="min-h-full min-h-[100dvh] flex flex-col justify-center items-center overflow-y-auto bg-gray-50 dark:bg-wa-dark-bg safe-top safe-bottom">
        <DropZone
          onFilesSelected={handleFilesSelected}
          onLoadDemo={handleLoadDemo}
          processingState={processingState}
        />
      </main>
    );
  }

  // SCREEN 2 & 3: Chat List & Chat Room
  return (
    <main className="h-full h-[100dvh] flex flex-col bg-gray-100 dark:bg-wa-dark-bg overflow-hidden safe-top safe-bottom">
      <div className="flex-1 flex w-full h-full max-w-7xl mx-auto md:my-auto md:h-[96vh] md:rounded-2xl md:shadow-2xl overflow-hidden md:border md:border-gray-200/80 dark:md:border-gray-800">
        
        {/* Left Column: Chat List */}
        <aside
          className={`flex-col h-full bg-white dark:bg-wa-dark-panel border-r border-gray-200 dark:border-gray-800 shrink-0 w-full md:w-80 lg:w-96 ${
            activeChatId ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatListHeader
            searchQuery={chatListSearch}
            onSearchChange={setChatListSearch}
            onReset={handleReset}
            chatCount={conversations.length}
          />

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/40">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  conversation={chat}
                  isSelected={chat.id === activeChatId}
                  searchQuery={chatListSearch}
                  onClick={() => handleOpenChat(chat.id)}
                />
              ))
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                No chats found matching &ldquo;{chatListSearch}&rdquo;
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Chat Room */}
        <section
          className={`flex-1 flex-col h-full bg-wa-bg-chat dark:bg-wa-dark-chat relative min-w-0 ${
            activeChatId ? "flex" : "hidden md:flex"
          }`}
        >
          {activeConversation ? (
            <>
              <ChatHeader
                conversation={activeConversation}
                onBack={handleCloseChat}
                searchOpen={inChatSearchOpen}
                searchQuery={inChatSearch}
                onToggleSearch={() => setInChatSearchOpen((prev) => !prev)}
                onSearchChange={setInChatSearch}
                onSwapSides={() => handleSwapSides(activeConversation.id)}
                onSelectParticipantPerspective={(sender) =>
                  handleSelectParticipantPerspective(activeConversation.id, sender)
                }
              />

              <MessageVirtualList
                key={activeConversation.id}
                conversation={activeConversation}
                searchFilter={inChatSearch}
                onPreviewImage={handleOpenPreviewImage}
              />

              {/* Read-only WhatsApp message input banner */}
              <div className="shrink-0 bg-wa-bg-panel dark:bg-wa-dark-panel px-3 py-2 flex items-center gap-2 border-t border-gray-200/60 dark:border-gray-800">
                <div className="flex-1 bg-white dark:bg-wa-dark-chat text-gray-400 dark:text-gray-500 rounded-full px-4 py-2 text-sm select-none border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                  <span>Archived Backup (Read-only)</span>
                  <Lock className="w-3.5 h-3.5 opacity-60" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center select-none bg-wa-bg-panel dark:bg-wa-dark-panel">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-wa-primary mb-4">
                <MessageSquare className="w-10 h-10 fill-current opacity-80" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-1">
                WhatsApp Backup Viewer
              </h3>
              <p className="text-gray-500 text-sm max-w-sm">
                Select a chat from the sidebar to view conversation history, voice notes, and media.
              </p>
              <div className="mt-8 flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>End-to-end client-side privacy verified</span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Lightbox Photo Preview Modal */}
      {previewImage && (
        <ImageViewerModal
          isOpen={true}
          url={previewImage.url}
          filename={previewImage.filename}
          onClose={handleClosePreviewImage}
        />
      )}

      {/* Toast: Press back again to exit viewer */}
      {showExitToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 dark:bg-gray-800/95 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2 select-none pointer-events-none">
          <span>Press back again to exit</span>
        </div>
      )}
    </main>
  );
}

