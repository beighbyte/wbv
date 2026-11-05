import React, { useState } from "react";
import { Search, FolderSync, MessageSquare, HeartHandshake } from "lucide-react";
import { DonateModal } from "../common/DonateModal";

interface ChatListHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onReset: () => void;
  chatCount: number;
}

export const ChatListHeader: React.FC<ChatListHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onReset,
  chatCount,
}) => {
  const [showDonateModal, setShowDonateModal] = useState(false);

  return (
    <div className="shrink-0 bg-white dark:bg-wa-dark-panel border-b border-gray-200 dark:border-gray-800">
      {/* Top Green WhatsApp Bar */}
      <div className="bg-wa-primary px-4 py-3 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 fill-current" />
          <h2 className="text-lg font-semibold tracking-wide">
            Chats ({chatCount})
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-1.5 text-xs text-white/95 hover:text-white bg-white/15 hover:bg-white/25 py-1.5 px-2.5 rounded-lg transition font-medium active:scale-95 shadow-xs"
            title="Donate & support this project"
          >
            <HeartHandshake className="w-4 h-4 text-emerald-200" />
            <span>Donate</span>
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 py-1.5 px-2.5 rounded-lg transition"
            title="Open a different backup"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Change Backup</span>
          </button>
        </div>
      </div>

      <DonateModal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
      />

      {/* WhatsApp Search Bar */}
      <div className="px-3 py-2 bg-gray-50/80 dark:bg-wa-dark-panel">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats or messages..."
            className="w-full bg-white dark:bg-wa-dark-chat border border-gray-200 dark:border-gray-700/80 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wa-primary/40 focus:border-wa-primary transition"
          />
        </div>
      </div>
    </div>
  );
};

