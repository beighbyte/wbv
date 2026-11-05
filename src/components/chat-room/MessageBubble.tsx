import React, { useState } from "react";
import { ChatMessage } from "@/types/chat";
import { VoiceNotePlayer } from "../media/VoiceNotePlayer";
import { VideoPlayer } from "../media/VideoPlayer";
import { DocumentCard } from "../media/DocumentCard";
import { FormattedText } from "./FormattedText";
import { HighlightText } from "../common/HighlightText";
import { getParticipantColor } from "@/lib/utils/colors";
import { useMediaUrl } from "@/lib/storage/use-media-url";
import { CheckCheck, Paperclip, AlertCircle, Loader2 } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  isGroup: boolean;
  isFirstInStreak?: boolean;
  searchQuery?: string;
  onPreviewImage: (url: string, filename: string) => void;
}

const CHAR_LIMIT = 420;
const LINE_LIMIT = 8;

const OutgoingTail: React.FC = () => (
  <svg
    viewBox="0 0 8 13"
    width="8"
    height="13"
    className="absolute top-0 -right-[7px] text-wa-bubble-out dark:text-wa-dark-bubble-out fill-current pointer-events-none z-10"
    preserveAspectRatio="none"
  >
    <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
  </svg>
);

const IncomingTail: React.FC = () => (
  <svg
    viewBox="0 0 8 13"
    width="8"
    height="13"
    className="absolute top-0 -left-[7px] text-wa-bubble-in dark:text-wa-dark-bubble-in fill-current pointer-events-none z-10"
    preserveAspectRatio="none"
  >
    <path d="M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z" />
  </svg>
);

const ExpandableMessageText: React.FC<{
  text: string;
  className?: string;
  searchQuery?: string;
}> = ({ text, className = "", searchQuery = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const lines = text.split(/\r?\n/);
  const isTooLong = text.length > CHAR_LIMIT || lines.length > LINE_LIMIT;

  if (!isTooLong || isExpanded) {
    return (
      <div className={className}>
        <FormattedText text={text} searchQuery={searchQuery} />
        {isTooLong && isExpanded && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="text-[#027eb5] dark:text-[#53bdeb] hover:underline font-medium text-[12.5px] ml-1.5 inline-block select-none"
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
      <FormattedText text={truncated.trimEnd() + "..."} searchQuery={searchQuery} />{" "}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(true);
        }}
        className="text-[#027eb5] dark:text-[#53bdeb] hover:underline font-medium text-[13px] inline-block select-none"
      >
        Read more
      </button>
    </div>
  );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isGroup,
  isFirstInStreak = true,
  searchQuery = "",
  onPreviewImage,
}) => {
  const isMine = message.direction === "out";
  const isSticker = message.mediaType === "sticker";
  const isEdited = Boolean(message.edited);
  const spacerWidth = isEdited ? "w-[104px]" : "w-[68px]";
  const { url: mediaUrl, loading: mediaLoading } = useMediaUrl(message.media, message.mediaUrl);

  const showTail = !isSticker && isFirstInStreak;
  const showSenderName = !isMine && isGroup && message.sender && isFirstInStreak;

  return (
    <div
      className={`flex ${isMine ? "justify-end" : "justify-start"} px-3 sm:px-4 ${
        isFirstInStreak ? "mt-1.5 mb-0.5" : "my-0.5"
      }`}
    >
      <div
        className={`relative ${
          isSticker
            ? "max-w-[70%]"
            : isMine
            ? `bg-wa-bubble-out dark:bg-wa-dark-bubble-out text-gray-900 dark:text-wa-dark-text px-2.5 pt-1.5 pb-2 shadow-xs max-w-[85%] sm:max-w-[75%] ${
                showTail ? "rounded-lg rounded-tr-none" : "rounded-lg"
              }`
            : `bg-wa-bubble-in dark:bg-wa-dark-bubble-in text-gray-900 dark:text-wa-dark-text px-2.5 pt-1.5 pb-2 shadow-xs max-w-[85%] sm:max-w-[75%] ${
                showTail ? "rounded-lg rounded-tl-none" : "rounded-lg"
              }`
        }`}
      >
        {/* Authentic WhatsApp SVG curved tail */}
        {showTail && (isMine ? <OutgoingTail /> : <IncomingTail />)}

        {/* Group Sender Name (shown only on first message in a streak) */}
        {showSenderName && message.sender && (
          <div
            className="text-[12.5px] font-semibold mb-1 px-0.5 select-none leading-tight"
            style={{ color: getParticipantColor(message.sender) }}
          >
            <HighlightText text={message.sender} query={searchQuery} />
          </div>
        )}

        {/* Deleted Message */}
        {message.deleted ? (
          <div className="italic text-gray-400 dark:text-gray-500 text-[13.5px] py-0.5 px-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 opacity-70" />
            <span>This message was deleted</span>
            <span className="inline-block w-[60px] h-3 select-none" aria-hidden="true" />
          </div>
        ) : message.omitted ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 italic px-1 py-1">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span>Media omitted from this export</span>
            <span className="inline-block w-[60px] h-3 select-none" aria-hidden="true" />
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
                  <div className="relative">
                    <img
                      src={mediaUrl}
                      alt={message.media}
                      className="rounded-lg max-h-72 max-w-full object-cover cursor-pointer hover:opacity-95 transition"
                      onClick={() => onPreviewImage(mediaUrl, message.media!)}
                    />
                  </div>
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

            {/* Caption below media */}
            {message.body && message.body.trim() && (
              <div className="relative pt-1">
                <ExpandableMessageText
                  text={message.body}
                  className="text-[14px] leading-relaxed break-words px-0.5 select-text"
                  searchQuery={searchQuery}
                />
                <span className={`inline-block ${spacerWidth} h-3 select-none`} aria-hidden="true" />
              </div>
            )}
          </div>
        ) : (
          /* Normal Text Message with WhatsApp inline timestamp spacer */
          <div className="relative leading-relaxed">
            <ExpandableMessageText
              text={message.body}
              className="text-[14px] break-words px-0.5 select-text"
              searchQuery={searchQuery}
            />
            {/* WhatsApp inline spacer: keeps timestamp on same line if room, wraps if full */}
            <span className={`inline-block ${spacerWidth} h-[10px] select-none`} aria-hidden="true" />
          </div>
        )}

        {/* Timestamp and ticks (floating in bottom right corner) */}
        {!isSticker && (
          <div className="absolute right-2 bottom-1 flex items-center justify-end gap-1 text-[10.5px] text-gray-500 dark:text-wa-dark-muted select-none pointer-events-none">
            {isEdited && (
              <span className="text-[10px] text-gray-500/80 dark:text-wa-dark-muted/80 italic select-none">
                Edited
              </span>
            )}
            <span>{message.time}</span>
            {isMine && <CheckCheck className="w-3.5 h-3.5 text-sky-500 stroke-[2.5]" />}
          </div>
        )}
      </div>
    </div>
  );
};
