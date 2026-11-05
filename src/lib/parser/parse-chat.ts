import { ChatMessage, Conversation } from "@/types/chat";
import {
  ANDROID_LINE_RE,
  IOS_LINE_RE,
  MEDIA_ATTACHED_PATTERNS,
  MEDIA_OMITTED_RE,
  stripEditedMarker,
  isSystemMessage,
  cleanSenderName,
  parseDateTimestamp,
} from "./patterns";
import { classifyMediaType } from "../utils/mime";
import { getParticipantColor } from "../utils/colors";

interface ParsedRawLine {
  date: string;
  time: string;
  sender: string | null;
  body: string;
}

function matchLine(raw: string): ParsedRawLine | null {
  const clean = raw.trim();

  // Android check
  let match = ANDROID_LINE_RE.exec(clean);
  if (match) {
    const [, date, time, senderRaw = "", bodyRaw = ""] = match;
    const sender = cleanSenderName(senderRaw);
    return { date, time, sender, body: bodyRaw };
  }

  // iOS check
  match = IOS_LINE_RE.exec(clean);
  if (match) {
    const [, date, time, senderRaw = "", bodyRaw = ""] = match;
    const sender = cleanSenderName(senderRaw);
    return { date, time, sender, body: bodyRaw };
  }

  return null;
}

function extractMediaFilename(body: string): string | null {
  for (const pat of MEDIA_ATTACHED_PATTERNS) {
    const m = pat.exec(body.trim());
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Checks if a sender name matches the contact name extracted from the filename,
 * accounting for partial names, saved contact vs WhatsApp profile name, and prefixes/suffixes.
 * Examples:
 * - "Sarah Jenkins" and "Sarah" -> true
 * - "Sarah" and "Sarah Jenkins" -> true
 * - "+1 (555) 234-5678" and "+15552345678" -> true
 * - "Alex Office" and "Alex" -> true
 * - "John Doe" and "Abrar" -> false
 */
export function isSameContactOrToken(targetContact: string, sender: string): boolean {
  if (!targetContact || !sender) return false;
  const a = targetContact.toLowerCase().trim();
  const b = sender.toLowerCase().trim();
  if (a === b) return true;

  // Normalize phone numbers / digits
  const digitsA = a.replace(/\D/g, "");
  const digitsB = b.replace(/\D/g, "");
  if (digitsA.length >= 7 && digitsB.length >= 7 && (digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA))) {
    return true;
  }

  // Tokenize words
  const tokensA = a.split(/[\s,._\-()]+/).filter((t) => t.length >= 2);
  const tokensB = b.split(/[\s,._\-()]+/).filter((t) => t.length >= 2);

  // If ANY meaningful word token (length >= 3) matches exactly
  for (const ta of tokensA) {
    if (ta.length >= 3 && tokensB.includes(ta)) {
      return true;
    }
  }

  return false;
}

export function parseChatTranscript(
  text: string,
  fileName: string,
  mediaMap: Record<string, string> = {},
  knownMyName: string | null = null
): Conversation | null {
  const lines = text.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  const senderCounts: Record<string, number> = {};

  let currentMsg: ChatMessage | null = null;
  let counter = 0;
  let hasGroupSystemEvent = false;
  let deletionFingerprintSender: string | null = null;

  for (const raw of lines) {
    if (!raw && !currentMsg) continue;

    const matched = matchLine(raw);
    if (matched) {
      if (currentMsg) {
        const { cleanBody, isEdited } = stripEditedMarker(currentMsg.body);
        currentMsg.body = cleanBody;
        if (isEdited) currentMsg.edited = true;
        messages.push(currentMsg);
      }

      const { date, time, sender, body } = matched;

      if (sender) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
        if (/you deleted this message/i.test(body) || sender.toLowerCase() === "you") {
          deletionFingerprintSender = sender;
        }
      }

      if (/created group|added you|joined using this group's invite/i.test(body)) {
        hasGroupSystemEvent = true;
      }

      const mediaFile = extractMediaFilename(body);
      const omitted = MEDIA_OMITTED_RE.test(body.trim());
      const isDeleted = /this message was deleted|you deleted this message/i.test(body);
      const isSys = isSystemMessage(body, sender);
      const ts = parseDateTimestamp(date, time);

      const mediaUrl = mediaFile ? mediaMap[mediaFile] : undefined;
      const mediaType = mediaFile ? classifyMediaType(mediaFile) : undefined;

      currentMsg = {
        id: `${fileName}_${counter++}`,
        date,
        time,
        timestamp: ts,
        sender,
        direction: "in", // will be accurately resolved below
        body: mediaFile || omitted ? "" : body,
        media: mediaFile,
        mediaUrl,
        mediaType,
        omitted,
        deleted: isDeleted,
        system: isSys,
      };
    } else if (currentMsg) {
      // Continuation of previous multi-line message
      currentMsg.body += "\n" + raw;
    }
  }

  if (currentMsg) {
    const { cleanBody, isEdited } = stripEditedMarker(currentMsg.body);
    currentMsg.body = cleanBody;
    if (isEdited) currentMsg.edited = true;
    messages.push(currentMsg);
  }

  if (messages.length === 0) return null;

  // Contact or group name from file name (supports Android 'with', iOS '-', or extensionless)
  let targetName = "";
  const nameFromFilename = /WhatsApp\s+Chat\s+(?:with|-|–|—)\s+(.+?)(?:\.[^/.]+)?$/i.exec(fileName);
  if (nameFromFilename) {
    targetName = cleanSenderName(nameFromFilename[1]) || nameFromFilename[1].trim();
  }

  const distinctSenders = Object.keys(senderCounts);
  const isGroup = hasGroupSystemEvent || distinctSenders.length > 2;

  // If group name is still not known from filename, check system messages for group creation/subject change
  if (isGroup && !targetName) {
    for (const m of messages) {
      if (m.system) {
        const subjectMatch = /(?:created group|changed the subject to|changed the subject from .* to)\s+["“]([^"”]+)["”]/i.exec(m.body);
        if (subjectMatch) {
          targetName = subjectMatch[1].trim();
          break;
        }
      }
    }
  }

  let resolvedMyName = knownMyName;

  // 1. Highest priority self-identity: deletion fingerprint from this chat
  if (!resolvedMyName && deletionFingerprintSender) {
    resolvedMyName = deletionFingerprintSender;
  }

  // 2. Fallback: check remembered identity from localStorage
  if (!resolvedMyName && typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("wbv_user_identity");
      if (saved && distinctSenders.some((s) => s.toLowerCase() === saved.toLowerCase())) {
        resolvedMyName = saved;
      }
    } catch {}
  }

  let contactName = targetName;

  if (!isGroup) {
    // 1-ON-1 CHAT:
    // Determine the Contact name vs My Name
    const contactInSenders = distinctSenders.find((s) => isSameContactOrToken(targetName, s));

    if (contactInSenders) {
      contactName = contactInSenders;
      if (!resolvedMyName) {
        const otherSender = distinctSenders.find((s) => s !== contactInSenders);
        if (otherSender) {
          resolvedMyName = otherSender;
        }
      }
    } else if (targetName) {
      contactName = targetName;
      if (!resolvedMyName) {
        const otherSender = distinctSenders.find((s) => !isSameContactOrToken(targetName, s));
        if (otherSender) {
          resolvedMyName = otherSender;
        }
      }
    } else {
      // No filename hint: if resolvedMyName is known, the other sender is contactName
      if (resolvedMyName) {
        const other = distinctSenders.find((s) => s.toLowerCase() !== resolvedMyName!.toLowerCase());
        contactName = other || distinctSenders[0] || "Chat";
      } else {
        contactName = distinctSenders[0] || "Chat";
        if (distinctSenders.length > 1) {
          resolvedMyName = distinctSenders[1];
        }
      }
    }

    // Set directions for 1-on-1:
    for (const msg of messages) {
      if (msg.sender) {
        if (msg.sender.toLowerCase() === "you") {
          msg.direction = "out";
        } else if (resolvedMyName && msg.sender.toLowerCase() === resolvedMyName.toLowerCase()) {
          msg.direction = "out";
        } else if (isSameContactOrToken(contactName, msg.sender)) {
          msg.direction = "in";
        } else {
          msg.direction = resolvedMyName ? "in" : "out";
        }
      }
    }
  } else {
    // GROUP CHAT:
    contactName = targetName || "Group Chat";

    // Set directions for Group:
    for (const msg of messages) {
      if (msg.sender) {
        if (msg.sender.toLowerCase() === "you") {
          msg.direction = "out";
        } else if (resolvedMyName && msg.sender.toLowerCase() === resolvedMyName.toLowerCase()) {
          msg.direction = "out";
        } else {
          msg.direction = "in";
        }
      }
    }
  }

  // Persist discovered identity for subsequent uploads & reloads
  if (resolvedMyName && typeof window !== "undefined") {
    try {
      localStorage.setItem("wbv_user_identity", resolvedMyName);
    } catch {}
  }

  const lastMsg = [...messages].reverse().find((m) => !m.system) || messages[messages.length - 1];
  const lastText = lastMsg
    ? lastMsg.media
      ? "📎 Media"
      : lastMsg.omitted
      ? "📎 Media"
      : lastMsg.body
    : "";

  return {
    id: `${fileName}_${Math.random().toString(36).slice(2, 9)}`,
    fileName,
    contactName,
    myName: resolvedMyName,
    isGroup,
    participants: distinctSenders,
    messages,
    messageCount: messages.length,
    mediaFiles: mediaMap,
    lastTimestamp: lastMsg?.timestamp || 0,
    lastMessage: lastText,
    color: getParticipantColor(contactName),
  };
}
