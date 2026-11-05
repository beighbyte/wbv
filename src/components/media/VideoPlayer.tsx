import React from "react";

interface VideoPlayerProps {
  url: string;
  isGif?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, isGif }) => {
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

  return (
    <video
      src={url}
      controls
      playsInline
      preload="metadata"
      className="rounded-lg max-h-64 max-w-[280px] bg-black"
    />
  );
};

