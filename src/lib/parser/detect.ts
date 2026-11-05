import { ANDROID_LINE_RE, IOS_LINE_RE } from "./patterns";

/**
 * Validates whether an arbitrary text snippet is genuine WhatsApp export transcript.
 * Guards against falsely treating sent code, logs, notes, or foreign text files as chat exports.
 */
export function isWhatsAppChatText(text: string, filename?: string): boolean {
  if (!text || text.length < 10) return false;

  // Header quick check
  if (filename && /whatsapp\s+chat\s+with/i.test(filename)) {
    return true;
  }
  if (/whatsapp\s+chat\s+with/i.test(text.slice(0, 300))) {
    return true;
  }

  const lines = text.split(/\r?\n/).slice(0, 50);
  let matchedLines = 0;
  let totalNonEmpty = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    totalNonEmpty++;

    // Strip Unicode direction markers
    const clean = trimmed.replace(/[\u200e\u200f]/g, "");
    if (ANDROID_LINE_RE.test(clean) || IOS_LINE_RE.test(clean)) {
      matchedLines++;
    }
  }

  if (totalNonEmpty === 0) return false;

  // A genuine WhatsApp chat should have at least 2 timestamped lines,
  // and at least 20% of the first 50 lines must match standard chat patterns
  return matchedLines >= 2 && matchedLines / totalNonEmpty >= 0.15;
}

