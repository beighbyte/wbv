import React from "react";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomFabProps {
  visible: boolean;
  onClick: () => void;
  unreadCount?: number;
}

export const ScrollToBottomFab: React.FC<ScrollToBottomFabProps> = ({
  visible,
  onClick,
  unreadCount,
}) => {
  if (!visible) return null;

  return (
    <div className="absolute right-4 bottom-16 z-30 animate-in fade-in zoom-in-90 duration-200">
      <button
        onClick={onClick}
        aria-label="Scroll to newest messages"
        className="relative w-10 h-10 rounded-full bg-white dark:bg-wa-dark-bubble-in text-gray-700 dark:text-gray-200 shadow-lg hover:shadow-xl hover:bg-gray-50 active:scale-95 flex items-center justify-center border border-gray-100 dark:border-gray-700 transition"
      >
        <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300 stroke-[2.5]" />
        {Boolean(unreadCount && unreadCount > 0) && (
          <span className="absolute -top-1.5 -right-1 bg-wa-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

