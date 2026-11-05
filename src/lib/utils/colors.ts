const PARTICIPANT_PALETTE = [
  "#1f7a8c",
  "#e07a5f",
  "#3d5a80",
  "#ee6c4d",
  "#2a9d8f",
  "#e76f51",
  "#023e8a",
  "#7209b7",
  "#0077b6",
  "#457b9d",
  "#9b5de5",
  "#f15bb5",
  "#00bbf9",
  "#00f5d4",
  "#d62828",
  "#f77f00",
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

