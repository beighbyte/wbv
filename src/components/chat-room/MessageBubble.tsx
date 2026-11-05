import React, { useState } from "react";
import { ChatMessage } from "@/types/chat";
import { VoiceNotePlayer } from "../media/VoiceNotePlayer";
import { VideoPlayer } from "../media/VideoPlayer";
import { DocumentCard } from "../media/DocumentCard";
import { getParticipantColor } from "@/lib/utils/colors";
import { useMediaUrl } from "@/lib/storage/use-media-url";
import { CheckCheck, Paperclip, AlertCircle, Loader2 } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isGroup: boolean;
  onPreviewImage: (url: string, filename: string) => void;
}

const CHAR_LIMIT = 420;
const LINE_LIMIT = 8;

const ExpandableMessageText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = text.split(/\r?\n/);
  const isTooLong = text.length > CHAR_LIMIT || lines.length > LINE_LIMIT;

  if (!isTooLong || isExpanded) {
    return (
      <div className={className}>
        <span>{text}</span>
        {isTooLong && isExpanded && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-[#027eb5] dark:text-emerald-400 hover:underline font-medium text-[12.5px] ml-1.5 inline-block select-none"
          >
            Read less
          </button>
        )}
      </div>
    );
  }

  let truncated = text.slice(0, CHAR_LIMIT);
  const truncatedLines = lines.slice(0, LINE_LIMIT).join("\n");
  if (truncatedLines.length < truncated.length) {
    truncated = truncatedLines;
  }

  return (
    <div className={className}>
      <span>{truncated.trimEnd()}... </span>
      <button
        onClick={() => setIsExpanded(true)}
        className="text-[#027eb5] dark:text-emerald-400 hover:underline font-medium text-[13px] inline-block select-none"
      >
        Read more
      </button>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  onPreviewImage,
}) => {
  const isMine = message.direction === "out";
  const isSticker = message.mediaType === "sticker";
  const { url: mediaUrl, loading: mediaLoading } = useMediaUrl(message.media, message.mediaUrl);

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} my-1 px-3`}>
      <div
        className={`relative ${
          isSticker
            ? "max-w-[70%]"
            : isMine
            ? "bg-wa-bubble-out dark:bg-wa-dark-bubble-out text-gray-900 dark:text-wa-dark-text rounded-lg rounded-tr-none px-2.5 py-1.5 shadow-xs max-w-[85%] sm:max-w-[75%]"
            : "bg-wa-bubble-in dark:bg-wa-dark-bubble-in text-gray-900 dark:text-wa-dark-text rounded-lg rounded-tl-none px-2.5 py-1.5 shadow-xs max-w-[85%] sm:max-w-[75%]"
        }`}
      >
        {/* Tail */}
        {!isSticker && (
          <span
            className={`absolute top-0 w-0 h-0 border-solid ${
              isMine
                ? "-right-2 border-t-[8px] border-l-[8px] border-r-0 border-b-0 border-t-wa-bubble-out dark:border-t-wa-dark-bubble-out border-l-transparent"
                : "-left-2 border-t-[8px] border-r-[8px] border-l-0 border-b-0 border-t-wa-bubble-in dark:border-t-wa-dark-bubble-in border-r-transparent"
            }`}
          />
        )}

        {/* Group Sender Name */}
        {!isMine && isGroup && message.sender && (
          <div
            className="text-[12px] font-semibold mb-1 px-0.5 select-none"
            style={{ color: getParticipantColor(message.sender) }}
          >
            {message.sender}
          </div>
        )}

        {/* Deleted Message */}
        {message.deleted ? (
          <div className="italic text-gray-400 dark:text-gray-500 text-[13.5px] py-0.5 px-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 opacity-70" />
            <span>This message was deleted</span>
          </div>
        ) : message.omitted ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 italic px-1 py-1">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span>Media omitted from this export</span>
          </div>
        ) : message.media ? (
          <div className="space-y-1">
            {mediaLoading ? (
              <div className="flex items-center gap-2 p-3 text-xs text-gray-500 min-w-[180px]">
                <Loader2 className="w-4 h-4 animate-spin text-wa-primary" />
                <span>Loading media...</span>
              </div>
            ) : mediaUrl ? (
              <>
                {message.mediaType === "sticker" ? (
                  <img
                    src={mediaUrl}
                    alt="sticker"
                    className="w-32 h-32 object-contain cursor-pointer"
                    onClick={() => onPreviewImage(mediaUrl, message.media!)}
                  />
                ) : message.mediaType === "image" ? (
                  <img
                    src={mediaUrl}
                    alt={message.media}
                    className="rounded-lg max-h-72 max-w-full object-cover cursor-pointer hover:opacity-95 transition"
                    onClick={() => onPreviewImage(mediaUrl, message.media!)}
                  />
                ) : message.mediaType === "video" ? (
                  <VideoPlayer url={mediaUrl} />
                ) : message.mediaType === "audio" ? (
                  <VoiceNotePlayer url={mediaUrl} filename={message.media} isMine={isMine} />
                ) : (
                  <DocumentCard url={mediaUrl} filename={message.media} />
                )}
              </>
            ) : (
              <DocumentCard filename={message.media} />
            )}

            {/* Caption below media with Read more if long */}
            {message.body && message.body.trim() && (
              <ExpandableMessageText
                text={message.body}
                className="text-[14px] leading-relaxed whitespace-pre-wrap break-words px-0.5 pt-1"
              />
            )}
          </div>
        ) : (
          <ExpandableMessageText
            text={message.body}
            className="text-[14px] leading-relaxed whitespace-pre-wrap break-words px-0.5 select-text"
          />
        )}

        {/* Time and ticks (only if not a sticker) */}
        {!isSticker && (
          <div className="flex items-center justify-end gap-1 text-[10.5px] text-gray-500 dark:text-gray-400 mt-0.5 select-none">
            <span>{message.time}</span>
            {isMine && <CheckCheck className="w-3.5 h-3.5 text-sky-500 stroke-[2.5]" />}
          </div>
        )}
      </div>
    </div>
  );
};
