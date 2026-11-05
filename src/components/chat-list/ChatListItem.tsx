import React from "react";
import { Conversation } from "@/types/chat";
import { Avatar } from "../common/Avatar";
import { HighlightText } from "../common/HighlightText";
import { formatChatListDate } from "@/lib/utils/date";
import { Users } from "lucide-react";

interface ChatListItemProps {
  conversation: Conversation;
  isSelected?: boolean;
  searchQuery?: string;
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({
  conversation,
  isSelected,
  searchQuery = "",
  onClick,
}) => {
  const timeFormatted = formatChatListDate(conversation.lastTimestamp);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick();
        }
      }}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none border-b border-gray-100 dark:border-gray-800/60 transition-colors ${
        isSelected
          ? "bg-gray-100 dark:bg-wa-dark-bubble-in"
          : "hover:bg-gray-50/80 dark:hover:bg-gray-800/40 active:bg-gray-100 dark:active:bg-gray-800"
      }`}
    >
      <div className="relative">
        <Avatar name={conversation.contactName} color={conversation.color} size="md" />
        {conversation.isGroup && (
          <div className="absolute -bottom-1 -right-1 bg-wa-primary text-white p-0.5 rounded-full ring-2 ring-white dark:ring-wa-dark-panel">
            <Users className="w-2.5 h-2.5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <HighlightText
            text={conversation.contactName}
            query={searchQuery}
            className="font-medium text-gray-900 dark:text-gray-100 text-[15px] truncate"
          />
          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 font-normal">
            {timeFormatted}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <HighlightText
            text={conversation.lastMessage || "No messages"}
            query={searchQuery}
            className="text-[13px] text-gray-500 dark:text-gray-400 truncate leading-snug"
          />
          <span className="text-[11px] text-gray-400 shrink-0">
            {(conversation.messageCount ?? conversation.messages.length).toLocaleString()} msgs
          </span>
        </div>
      </div>
    </div>
  );
};

