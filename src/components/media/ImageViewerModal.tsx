"use client";

import React, { useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  filename: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  url,
  filename,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);
  const resetTransform = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-150">
      {/* Top action bar */}
      <div className="flex items-center justify-between p-3 text-white z-10 shrink-0 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition"
          aria-label="Close image preview"
        >
          <X className="w-6 h-6" />
        </button>

        <span className="text-xs text-white/80 truncate max-w-xs px-2">{filename}</span>

        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition"
            title="Rotate"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <a
            href={url}
            download={filename}
            className="p-2 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onDoubleClick={resetTransform}
      >
        <img
          src={url}
          alt={filename}
          className="max-h-full max-w-full object-contain transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

