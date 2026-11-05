"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { Apple, Smartphone, CheckCircle2 } from "lucide-react";

interface ExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportGuideModal: React.FC<ExportGuideModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<"android" | "ios">("android");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Export WhatsApp Chats" maxWidth="lg">
      <div className="space-y-4">
        {/* Platform Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => setPlatform("android")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
              platform === "android"
                ? "bg-white dark:bg-wa-dark-panel text-wa-primary dark:text-emerald-400 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setPlatform("ios")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
              platform === "ios"
                ? "bg-white dark:bg-wa-dark-panel text-wa-primary dark:text-emerald-400 shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone (iOS)</span>
          </button>
        </div>

        {platform === "android" ? (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <p>Open the WhatsApp chat you want to save.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <p>Tap the <strong>three dots (⋮)</strong> at top right &rarr; <strong>More</strong> &rarr; <strong>Export chat</strong>.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <p>Choose <strong>Attach Media</strong> (if you want voice notes and photos) or <strong>Without Media</strong>.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </span>
              <p>Save the generated <code>.zip</code> file to your device, then drop it into this viewer!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </span>
              <p>Open the chat in WhatsApp on your iPhone.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </span>
              <p>Tap the contact or group name at the top to open <strong>Contact Info</strong>.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </span>
              <p>Scroll down and tap <strong>Export Chat</strong> &rarr; select <strong>Attach Media</strong>.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-wa-primary/10 text-wa-primary dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </span>
              <p>Tap <strong>Save to Files</strong>. Select that <code>.zip</code> file here to view everything smoothly!</p>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-wa-primary hover:bg-wa-primary-dark text-white rounded-lg text-sm font-medium transition"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </Modal>
  );
};

