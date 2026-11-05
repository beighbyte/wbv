// Regular expressions for WhatsApp chat exports across Android, iOS, and various locales

// Android format: "12/05/2023, 10:30 am - Name: message"
// Note: WhatsApp uses narrow no-break space (\u202f) or standard space before am/pm
export const ANDROID_LINE_RE =
  /^(\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}),\s+(\d{1,2}:\d{2}(?::\d{2})?[\s\u202f\u00a0]*(?:[ap]\.?m\.?)?)\s+-\s+(?:([^:]+):\s?)?(.*)$/i;

// iOS format: "[12/05/2023, 10:30:15 AM] Name: message"
export const IOS_LINE_RE =
  /^\[(\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?[\s\u202f\u00a0]*(?:[ap]\.?m\.?)?)\]\s+(?:([^:]+):\s?)?(.*)$/i;

// Media attached variations
export const MEDIA_ATTACHED_PATTERNS = [
  /^(\S+[\w\s.-]+\.\w{2,5})\s+\(file attached\)$/i,
  /^<attached:\s*([^>]+)>$/i,
  /^‎?<attached:\s*([^>]+)>$/i,
];

// Omitted media markers
export const MEDIA_OMITTED_RE =
  /^(?:<Media omitted>|<Fichier omis>|<Audio omesso>|Media omitted|‎image omitted|‎video omitted|‎audio omitted|‎sticker omitted|‎document omitted|‎Contact card omitted|‎GIF omitted)/i;

// Group & System message indicators
export const SYS_PATTERNS = [
  /messages and calls are end-to-end encrypted/i,
  /created group/i,
  /added you/i,
  /added \+/i,
  /joined using this group's invite link/i,
  /left/i,
  /removed/i,
  /changed the subject/i,
  /changed this group's icon/i,
  /changed this group's settings/i,
  /changed the group description/i,
  /pinned a message/i,
  /security code (?:with .+ )?changed/i,
  /this message was deleted/i,
  /you deleted this message/i,
  /missed (?:voice|video) call/i,
  /waiting for this message/i,
  /POLL:/i,
];

export function isSystemMessage(body: string, sender: string | null): boolean {
  if (!sender) return true;
  return SYS_PATTERNS.some((regex) => regex.test(body));
}

export function cleanSenderName(raw: string | null): string | null {
  if (!raw) return null;
  // Remove directional markers, zero-width chars, and leading tilde (WhatsApp display name marker)
  return raw
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/^~\s*/, "")
    .trim() || null;
}

export function parseDateTimestamp(dateStr: string, timeStr: string): number {
  try {
    const cleanDate = dateStr.replace(/[\u200e\u200f]/g, "").trim();
    const dateParts = cleanDate.split(/[/.-]/).map(Number);
    if (dateParts.length !== 3) return 0;

    let day = dateParts[0];
    let month = dateParts[1];
    let year = dateParts[2];

    if (dateParts[0] > 1000) {
      // YYYY-MM-DD
      year = dateParts[0];
      month = dateParts[1];
      day = dateParts[2];
    } else if (dateParts[2] < 100) {
      year = 2000 + dateParts[2];
    }

    const cleanTime = timeStr.replace(/[\u200e\u200f\u202f\u00a0.]/g, " ").trim().toLowerCase();
    const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(cleanTime);
    if (!timeMatch) return 0;

    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    const ampm = timeMatch[4];

    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;

    if (month > 12 && day <= 12) {
      const temp = month;
      month = day;
      day = temp;
    }

    const d = new Date(year, month - 1, day, hour, minute, second);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  } catch {
    return 0;
  }
}
