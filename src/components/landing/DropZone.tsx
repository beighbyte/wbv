"use client";

import React, { useRef, useState } from "react";
import { FolderUp, FileArchive, UploadCloud, HelpCircle, Sparkles, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { ExportGuideModal } from "./ExportGuideModal";
import { FolderUploadNoticeModal } from "./FolderUploadNoticeModal";
import { RazorpayButton } from "../common/RazorpayButton";
import { ProcessingState } from "@/types/chat";

interface DropZoneProps {
  onFilesSelected: (files: File[] | FileList) => void;
  onLoadDemo: () => void;
  processingState: ProcessingState;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onLoadDemo,
  processingState,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showFolderNotice, setShowFolderNotice] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFolderButtonClick = () => {
    const skip =
      typeof window !== "undefined" &&
      localStorage.getItem("wbv_skip_folder_notice") === "true";

    if (skip) {
      folderInputRef.current?.click();
    } else {
      setShowFolderNotice(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const isBusy = ["reading", "extracting", "parsing"].includes(processingState.stage);

  return (
    <div className="w-full max-w-md mx-auto px-5 py-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is standard in Chromium/Firefox
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
          }
        }}
      />

      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-14 h-14 mx-auto mb-2.5 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-lg shadow-green-500/20">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          WhatsApp Backup Viewer
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-[13px] mt-1 leading-snug px-2">
          View your exported chats with full media, voice notes & stickers.
        </p>

        {/* Top Privacy Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-[11.5px] font-medium shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>All backups are decoded directly in your browser</span>
        </div>

        {/* Validation / Error Notice */}
        {processingState.stage === "error" && processingState.error && (
          <div className="mt-3 p-3 text-left rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span>{processingState.error}</span>
          </div>
        )}
      </div>

      {/* Main Upload / Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-200 bg-white dark:bg-wa-dark-panel shadow-sm ${
          isDragging
            ? "border-wa-primary bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]"
            : "border-gray-200 dark:border-gray-700"
        }`}
      >
        {isBusy ? (
          <div className="py-6 space-y-3">
            <div className="w-11 h-11 mx-auto rounded-full bg-wa-primary/10 text-wa-primary flex items-center justify-center animate-spin">
              <Loader2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                {processingState.message}
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-2.5 overflow-hidden">
                <div
                  className="bg-wa-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingState.progress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-11 h-11 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-wa-primary" />
            </div>

            <div className="px-1">
              <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200">
                Drop your exported <strong className="text-wa-primary">.zip</strong> or folder here
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                iOS & Android exports • With or without media
              </p>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-wa-primary hover:bg-wa-primary-dark active:scale-[0.98] text-white text-sm font-semibold py-3 px-5 rounded-xl shadow-sm transition"
            >
              <FileArchive className="w-4 h-4" />
              <span>Select .ZIP or Files</span>
            </button>

            {/* Secondary Action Button */}
            <button
              onClick={handleFolderButtonClick}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium py-2.5 px-4 rounded-xl transition"
            >
              <FolderUp className="w-4 h-4" />
              <span>Select Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Directly Below Drop Zone: Quick Actions */}
      <div className="flex items-center justify-between px-1 mt-3">
        <button
          onClick={() => setShowGuide(true)}
          className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-wa-primary transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          <span>How to export chat?</span>
        </button>

        <button
          onClick={onLoadDemo}
          className="flex items-center gap-1.5 text-[12px] font-medium text-wa-primary hover:text-wa-primary-dark transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try Demo</span>
        </button>
      </div>

      {/* Open Source Trust & Support Section */}
      <div className="mt-7 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-gray-50 dark:bg-wa-dark-panel p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
          <a
            href="https://github.com/beighbyte/wbv"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg className="w-4 h-4 fill-current text-gray-800 dark:text-gray-200" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>beighbyte/wbv</span>
            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
              Open Source
            </span>
          </a>

          <RazorpayButton buttonId="pl_TwXdNlxd0SVJGC" fallbackUrl="https://razorpay.me/@beighbyte" />
        </div>
      </div>

      <ExportGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <FolderUploadNoticeModal
        isOpen={showFolderNotice}
        onClose={() => setShowFolderNotice(false)}
        onProceed={() => folderInputRef.current?.click()}
      />
    </div>
  );
};
