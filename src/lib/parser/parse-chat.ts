import { ChatMessage, Conversation } from "@/types/chat";
import {
  ANDROID_LINE_RE,
  IOS_LINE_RE,
  MEDIA_ATTACHED_PATTERNS,
  MEDIA_OMITTED_RE,
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

  for (const raw of lines) {
    if (!raw && !currentMsg) continue;

    const matched = matchLine(raw);
    if (matched) {
      if (currentMsg) {
        messages.push(currentMsg);
      }

      const { date, time, sender, body } = matched;

      if (sender) {
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
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
  let contactName = targetName;

  if (!isGroup) {
    // 1-ON-1 CHAT:
    // Exactly two participants: the Contact (targetName) and Me
    if (!targetName && distinctSenders.length > 0) {
      if (resolvedMyName) {
        const contact = distinctSenders.find((s) => s.toLowerCase() !== resolvedMyName!.toLowerCase());
        contactName = contact || distinctSenders[0];
      } else {
        contactName = distinctSenders[0];
      }
    } else {
      contactName = targetName || (distinctSenders.length > 0 ? distinctSenders[0] : "Chat");
    }

    // The other sender must be "Me"
    if (!resolvedMyName) {
      const otherSender = distinctSenders.find((s) => s.toLowerCase() !== contactName.toLowerCase());
      if (otherSender) {
        resolvedMyName = otherSender;
      }
    }

    // Now set directions with 100% accuracy:
    // If the sender is the contact -> incoming ('in')
    // If the sender is NOT the contact -> outgoing ('out')
    for (const msg of messages) {
      if (msg.sender) {
        if (msg.sender.toLowerCase() === contactName.toLowerCase()) {
          msg.direction = "in";
        } else {
          msg.direction = "out";
        }
      }
    }
  } else {
    // GROUP CHAT:
    contactName = targetName || "Group Chat";

    // Set directions:
    for (const msg of messages) {
      if (msg.sender && resolvedMyName && msg.sender.toLowerCase() === resolvedMyName.toLowerCase()) {
        msg.direction = "out";
      } else {
        msg.direction = "in";
      }
    }
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
