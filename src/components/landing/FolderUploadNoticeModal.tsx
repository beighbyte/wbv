"use client";

import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { FolderUp, WifiOff, HelpCircle } from "lucide-react";

interface FolderUploadNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const FolderUploadNoticeModal: React.FC<FolderUploadNoticeModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem("wbv_skip_folder_notice", "true");
      } catch {}
    }
    onClose();
    setTimeout(() => {
      onProceed();
    }, 100);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Opening a Folder" maxWidth="md">
      <div className="space-y-4">
        {/* Real browser dialog screenshot */}
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-wa-dark-bg p-2 flex justify-center">
          <img
            src="/upload.jpeg"
            alt="Browser folder upload prompt"
            className="max-h-36 rounded-lg object-contain shadow-xs"
          />
        </div>

        {/* Information List */}
        <div className="space-y-3 text-xs">
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mb-0.5">
              <HelpCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
              <span>You might see this prompt when picking a folder</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 pl-5 leading-relaxed">
              On this website, clicking &ldquo;Upload&rdquo; only allows your browser to open and read
              your chat backup locally on this device. We have no servers or upload endpoints.
            </p>
          </div>

          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mb-0.5">
              <WifiOff className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
              <span>How can you verify this?</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 pl-5 leading-relaxed">
              You can turn off Wi-Fi or disconnect from the internet before choosing the folder. wbv
              will decode and display your chats completely offline.
            </p>
          </div>
        </div>

        {/* Checkbox: Don't show again */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-wa-primary focus:ring-wa-primary border-gray-300 dark:border-gray-700 dark:bg-gray-800 cursor-pointer"
            />
            <span>Don&apos;t show this again</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-wa-primary hover:bg-wa-primary-dark transition shadow-sm active:scale-98"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Select Folder</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
