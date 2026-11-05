// High-contrast, clean modern palette designed to never blend with the WhatsApp #008069 header
const PARTICIPANT_PALETTE = [
  "#2563eb", // Royal Blue
  "#7c3aed", // Violet
  "#db2777", // Rose / Pink
  "#ea580c", // Coral Orange
  "#0284c7", // Sky Blue
  "#9333ea", // Purple
  "#d97706", // Amber
  "#0891b2", // Cyan
  "#4f46e5", // Indigo
  "#e11d48", // Crimson Red
  "#0d9488", // Deep Teal (distinct from wa-primary)
  "#c026d3", // Fuchsia
  "#475569", // Slate
];

export function getParticipantColor(name: string): string {
  if (!name) return "#667781";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PARTICIPANT_PALETTE.length;
  return PARTICIPANT_PALETTE[index];
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const clean = name.replace(/^\+?\d+\s*/, "").trim();
  if (!clean) return "#";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

