"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatMessage, Conversation } from "@/types/chat";
import { MessageBubble } from "./MessageBubble";
import { DateDivider } from "./DateDivider";
import { SystemEventBubble } from "./SystemEventBubble";
import { ScrollToBottomFab } from "./ScrollToBottomFab";

interface MessageVirtualListProps {
  conversation: Conversation;
  searchFilter?: string;
  onPreviewImage: (url: string, filename: string) => void;
}

type VirtualItem =
  | { type: "date"; date: string; timestamp?: number; key: string }
  | { type: "message"; message: ChatMessage; key: string };

export const MessageVirtualList: React.FC<MessageVirtualListProps> = ({
  conversation,
  searchFilter = "",
  onPreviewImage,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isUserScrollingUpRef = useRef(false);

  // Flatten messages and insert date dividers
  const items = useMemo<VirtualItem[]>(() => {
    const list: VirtualItem[] = [];
    let lastDate: string | null = null;

    const filtered = searchFilter
      ? conversation.messages.filter(
          (m) =>
            m.body.toLowerCase().includes(searchFilter.toLowerCase()) ||
            (m.sender && m.sender.toLowerCase().includes(searchFilter.toLowerCase()))
        )
      : conversation.messages;

    for (let i = 0; i < filtered.length; i++) {
      const msg = filtered[i];
      if (msg.date && msg.date !== lastDate) {
        lastDate = msg.date;
        list.push({
          type: "date",
          date: msg.date,
          timestamp: msg.timestamp,
          key: `date_${msg.date}_${i}`,
        });
      }
      list.push({
        type: "message",
        message: msg,
        key: msg.id,
      });
    }

    return list;
  }, [conversation.messages, searchFilter]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = items[index];
      if (item.type === "date") return 40;
      if (item.message.system && !item.message.sender) return 44;
      if (item.message.media) return 220;
      return 60;
    },
    overscan: 15,
  });

  // Instant scroll to the latest message whenever chat switches or items load
  const jumpToBottomInstant = () => {
    if (!parentRef.current || items.length === 0) return;
    // 1. Tell Tanstack virtualizer to target the last item
    virtualizer.scrollToIndex(items.length - 1, { align: "end", behavior: "auto" });
    // 2. Ensure container scroll matches the full scrollHeight
    parentRef.current.scrollTop = parentRef.current.scrollHeight;
  };

  useLayoutEffect(() => {
    isUserScrollingUpRef.current = false;
    setShowScrollBottom(false);

    if (items.length === 0) return;

    // Immediate jump before browser paint
    jumpToBottomInstant();

    // Secondary adjustments as dynamic measurements occur (images, multi-lines)
    const raf1 = requestAnimationFrame(() => {
      if (!isUserScrollingUpRef.current) {
        jumpToBottomInstant();
      }
    });

    const timer1 = setTimeout(() => {
      if (!isUserScrollingUpRef.current) {
        jumpToBottomInstant();
      }
    }, 50);

    const timer2 = setTimeout(() => {
      if (!isUserScrollingUpRef.current) {
        jumpToBottomInstant();
      }
    }, 200);

    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [conversation.id, items.length]);

  // Handle scroll events to toggle "Scroll to bottom" button
  const handleScroll = () => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 150) {
      isUserScrollingUpRef.current = true;
      setShowScrollBottom(true);
    } else {
      isUserScrollingUpRef.current = false;
      setShowScrollBottom(false);
    }
  };

  const handleSmoothScrollToBottom = () => {
    if (!parentRef.current || items.length === 0) return;
    isUserScrollingUpRef.current = false;
    setShowScrollBottom(false);
    virtualizer.scrollToIndex(items.length - 1, { align: "end", behavior: "smooth" });
  };

  return (
    <div className="relative flex-1 h-full min-h-0 overflow-hidden bg-wa-bg-chat dark:bg-wa-dark-chat">
      {/* Background doodle pattern */}
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Main scrollable viewport (NO scroll-smooth on container to prevent virtualization lockup) */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-1 sm:px-4 py-2 relative focus:outline-none"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];

            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item.type === "date" ? (
                  <DateDivider date={item.date} timestamp={item.timestamp} />
                ) : item.message.system && !item.message.sender ? (
                  <SystemEventBubble message={item.message.body} />
                ) : (
                  <MessageBubble
                    message={item.message}
                    isGroup={conversation.isGroup}
                    searchQuery={searchFilter}
                    onPreviewImage={onPreviewImage}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Scroll to Bottom Floating Action Button */}
      <ScrollToBottomFab visible={showScrollBottom} onClick={handleSmoothScrollToBottom} />
    </div>
  );
};
