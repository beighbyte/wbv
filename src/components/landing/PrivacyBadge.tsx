import React from "react";
import { ShieldCheck } from "lucide-react";

export const PrivacyBadge: React.FC = () => {
  return (
    <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl p-3 flex items-center gap-2.5 mt-3 text-left">
      <div className="p-1.5 bg-emerald-500 text-white rounded-lg shrink-0 shadow-xs">
        <ShieldCheck className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[12px] font-semibold text-emerald-900 dark:text-emerald-300 leading-tight">
          100% Client-Side Privacy
        </div>
        <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5 leading-snug">
          All backups are decoded directly in your browser.
        </p>
      </div>
    </div>
  );
};
