"use client";

import React from "react";
import { Modal } from "./Modal";
import { RazorpayButton } from "./RazorpayButton";
import { HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="p-6 text-center">
        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-wa-primary flex items-center justify-center border border-emerald-100 dark:border-emerald-800/60 shadow-xs">
          <HeartHandshake className="w-7 h-7 text-wa-primary" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Support wbv
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Free • 100% Client-Side • Privacy-First
        </p>

        {/* Motivational / Encouraging Message */}
        <div className="my-5 p-4 rounded-xl bg-gray-50/80 dark:bg-wa-dark-chat/60 border border-gray-100 dark:border-gray-800 text-left space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>wbv is built independently</strong> to let anyone view, search, and cherish their chat memories without sending a single byte to any remote server.
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              No subscription paywalls, no ads, and no data tracking. If this tool saved you time or rescued your chats, buying a coffee or contributing keeps the project maintained and active!
            </span>
          </div>
        </div>

        {/* Razorpay Button Embed */}
        <div className="py-2 flex flex-col items-center justify-center gap-2">
          <RazorpayButton
            buttonId="pl_TwXdNlxd0SVJGC"
            fallbackUrl="https://razorpay.me/@beighbyte"
          />

          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Secure payments via UPI, Debit/Credit Card & NetBanking.
          </p>
        </div>

        {/* Footer Dismiss */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
};

