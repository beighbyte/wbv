import React from "react";
import { Lock } from "lucide-react";

interface SystemEventBubbleProps {
  message: string;
}

export const SystemEventBubble: React.FC<SystemEventBubbleProps> = ({ message }) => {
  const isEncryption = /end-to-end encrypted/i.test(message);

  return (
    <div className="flex justify-center my-2 select-none px-4">
      <div className="bg-[#ffeecd] dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800/40 text-[11.5px] px-3.5 py-1.5 rounded-lg shadow-sm text-center max-w-[85%] leading-relaxed flex items-center justify-center gap-1.5">
        {isEncryption && <Lock className="w-3.5 h-3.5 shrink-0 opacity-80" />}
        <span>{message}</span>
      </div>
    </div>
  );
};

