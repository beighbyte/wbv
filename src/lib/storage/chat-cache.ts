import { ChatMessage } from "@/types/chat";
import { parseChatTranscript } from "../parser/parse-chat";

/**
 * LRU Cache for parsed chat messages.
 * Keeps the most recently visited conversations in memory for INSTANT re-visiting,
 * while automatically evicting older chats to prevent phone RAM bloat.
 */
class ChatCache {
  // chatId -> ChatMessage[]
  private cache = new Map<string, ChatMessage[]>();
  // Max conversations kept fully parsed in RAM at any time
  private readonly MAX_CACHED_CHATS = 5;

  has(chatId: string): boolean {
    return this.cache.has(chatId);
  }

  get(chatId: string): ChatMessage[] | undefined {
    if (!this.cache.has(chatId)) return undefined;

    // Refresh LRU order (move to end)
    const messages = this.cache.get(chatId)!;
    this.cache.delete(chatId);
    this.cache.set(chatId, messages);
    return messages;
  }

  set(chatId: string, messages: ChatMessage[]) {
    // Evict oldest chat if cache limit reached
    if (this.cache.size >= this.MAX_CACHED_CHATS) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(chatId, messages);
  }

  /**
   * Fast load or retrieve:
   * Returns immediately if cached; otherwise parses and caches in < 50ms.
   */
  getOrParse(
    chatId: string,
    rawText: string,
    fileName: string,
    myName: string | null = null
  ): ChatMessage[] {
    const cached = this.get(chatId);
    if (cached) {
      return cached;
    }

    const parsed = parseChatTranscript(rawText, fileName, {}, myName);
    const msgs = parsed?.messages || [];
    this.set(chatId, msgs);
    return msgs;
  }

  clear() {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const chatCache = new ChatCache();

