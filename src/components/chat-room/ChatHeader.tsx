"use client";

import React, { useState } from "react";
import { ArrowLeft, Search, X, ArrowLeftRight, UserCheck } from "lucide-react";
import { Avatar } from "../common/Avatar";
import { Conversation } from "@/types/chat";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  searchOpen: boolean;
  searchQuery: string;
  onToggleSearch: () => void;
  onSearchChange: (q: string) => void;
  onSwapSides: () => void;
  onSelectParticipantPerspective?: (senderName: string) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onBack,
  searchOpen,
  searchQuery,
  onToggleSearch,
  onSearchChange,
  onSwapSides,
  onSelectParticipantPerspective,
}) => {
  const [showParticipantMenu, setShowParticipantMenu] = useState(false);

  return (
    <div className="shrink-0 bg-wa-primary text-white shadow-sm z-20 relative">
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-full hover:bg-white/10 active:bg-white/20 transition text-white"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <Avatar name={conversation.contactName} color={conversation.color} size="sm" />

          <div className="min-w-0">
            <h3 className="font-semibold text-[15px] truncate leading-tight">
              {conversation.contactName}
            </h3>
            <p className="text-[11px] text-white/80 truncate">
              {conversation.isGroup
                ? `${conversation.participants.length} participants • ${conversation.messages.length} messages`
                : `${conversation.messages.length} messages`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Swap / Perspective Button */}
          {conversation.isGroup ? (
            <div className="relative">
              <button
                onClick={() => setShowParticipantMenu((prev) => !prev)}
                className="flex items-center gap-1 py-1 px-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs text-white transition"
                title="Change whose perspective to view this group from"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {conversation.myName ? `Me: ${conversation.myName.slice(0, 10)}` : "Set My Name"}
                </span>
              </button>

              {showParticipantMenu && (
                <div className="absolute right-0 top-9 w-60 max-h-64 overflow-y-auto bg-white dark:bg-wa-dark-panel text-gray-800 dark:text-gray-100 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 z-50 text-xs">
                  <div className="px-3 py-1.5 font-semibold text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    Select who YOU are in this group:
                  </div>
                  <button
                    onClick={() => {
                      onSelectParticipantPerspective?.("");
                      setShowParticipantMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between ${
                      !conversation.myName ? "font-bold text-wa-primary" : ""
                    }`}
                  >
                    <span>None (View all as incoming)</span>
                  </button>
                  {conversation.participants.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        onSelectParticipantPerspective?.(p);
                        setShowParticipantMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 truncate flex items-center justify-between ${
                        conversation.myName === p ? "font-bold text-wa-primary" : ""
                      }`}
                    >
                      <span className="truncate">{p}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onSwapSides}
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs text-white transition"
              title="Swap Left/Right bubbles"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Swap Sides</span>
            </button>
          )}

          <button
            onClick={onToggleSearch}
            className={`p-2 rounded-full transition ${
              searchOpen ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/90"
            }`}
            title="Search inside this chat"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* In-chat search box */}
      {searchOpen && (
        <div className="px-3 pb-2 pt-1 bg-wa-primary-dark/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search in conversation..."
              className="w-full bg-white dark:bg-wa-dark-panel text-gray-900 dark:text-gray-100 text-sm rounded-lg pl-9 pr-8 py-1.5 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
