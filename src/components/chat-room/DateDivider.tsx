import React from "react";
import { formatDateDivider } from "@/lib/utils/date";

interface DateDividerProps {
  date: string;
  timestamp?: number;
}

export const DateDivider: React.FC<DateDividerProps> = ({ date, timestamp }) => {
  const formatted = formatDateDivider(date, timestamp);

  return (
    <div className="flex justify-center my-3 select-none">
      <div className="bg-white/90 dark:bg-wa-dark-panel/90 backdrop-blur-sm text-gray-600 dark:text-gray-300 text-[11.5px] font-medium px-3 py-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        {formatted}
      </div>
    </div>
  );
};

