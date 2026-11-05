"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Mic } from "lucide-react";

interface VoiceNotePlayerProps {
  url: string;
  filename: string;
  isMine: boolean;
}

function generateWaveformBars(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  const bars: number[] = [];
  for (let i = 0; i < 28; i++) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    bars.push(4 + (Math.abs(hash) % 18));
  }
  return bars;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ url, filename, isMine }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bars = useRef(generateWaveformBars(filename)).current;

  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    audio.addEventListener("pause", () => {
      setIsPlaying(false);
    });

    audio.addEventListener("play", () => {
      setIsPlaying(true);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().catch(() => {});
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const activeBarIndex = Math.floor(progressRatio * bars.length);

  const formatSec = (sec: number) => {
    if (!isFinite(sec) || sec <= 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[240px] max-w-[290px] select-none">
      {/* WhatsApp Play Button with Mic badge */}
      <div className="relative shrink-0">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-wa-primary hover:bg-wa-primary-dark text-white flex items-center justify-center shadow transition active:scale-95"
          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>
        <span className="absolute -bottom-1 -right-1 bg-white dark:bg-wa-dark-panel text-wa-primary p-0.5 rounded-full shadow-xs">
          <Mic className="w-3 h-3" />
        </span>
      </div>

      {/* Waveform */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className="flex items-center gap-[2.5px] h-6 cursor-pointer">
          {bars.map((h, i) => {
            const played = i <= activeBarIndex;
            return (
              <div
                key={i}
                className={`w-[2.5px] rounded-full transition-colors ${
                  played
                    ? "bg-wa-primary"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
                style={{ height: `${h}px` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>{formatSec(isPlaying ? currentTime : duration)}</span>
          <button
            onClick={cycleSpeed}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 hover:bg-black/10 transition"
            title="Change playback speed"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};

