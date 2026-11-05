"use client";

import React, { useState } from "react";
import { Play, Video } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  isGif?: boolean;
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "";
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const paddedSecs = secs.toString().padStart(2, "0");
  if (hrs > 0) {
    const paddedMins = mins.toString().padStart(2, "0");
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }
  return `${mins}:${paddedSecs}`;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, isGif }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  // WhatsApp GIF mode (looping, muted, auto-playing)
  if (isGif) {
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        className="rounded-lg max-h-64 max-w-full object-cover"
      />
    );
  }

  // Active playing mode (mounted on-demand when clicked)
  if (isPlaying) {
    return (
      <div className="relative rounded-lg overflow-hidden max-h-72 max-w-[320px] bg-black">
        <video
          src={url}
          controls
          autoPlay
          playsInline
          className="w-full h-full max-h-72 object-contain"
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    );
  }

  // Idle / Preview mode: Lightweight thumbnail card with centered Play button
  // Consumes 0 hardware video decoders while scrolling!
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsPlaying(true);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          setIsPlaying(true);
        }
      }}
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-black/90 max-h-72 max-w-[320px] aspect-video flex items-center justify-center select-none shadow-xs border border-black/10 dark:border-white/5"
      title="Click to play video"
    >
      {/* Poster preview frame via HTML5 first frame seek (#t=0.1) */}
      <video
        src={`${url}#t=0.1`}
        preload="metadata"
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
            setDuration(e.currentTarget.duration);
          }
        }}
        className="w-full h-full object-cover pointer-events-none opacity-85 group-hover:opacity-95 transition-opacity duration-200"
      />

      {/* WhatsApp-style Frosted Glass Play Button */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-black/60 dark:bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-black/80 transition-all duration-200 ring-1 ring-white/20">
          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
        </div>
      </div>

      {/* Bottom-left video duration pill */}
      {duration !== null && duration > 0 && (
        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[11px] text-white/95 font-medium flex items-center gap-1 select-none pointer-events-none shadow-xs">
          <Video className="w-3 h-3 text-white/80" />
          <span>{formatDuration(duration)}</span>
        </div>
      )}
    </div>
  );
};
