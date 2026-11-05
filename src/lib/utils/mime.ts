import { MediaType } from "@/types/chat";

export const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  ico: "image/x-icon",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  "3gp": "video/3gpp",
  m4v: "video/x-m4v",
  ogv: "video/ogg",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  wav: "audio/wav",
  flac: "audio/flac",
  oga: "audio/ogg",
  amr: "audio/amr",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  log: "text/plain",
  json: "application/json",
  xml: "application/xml",
  html: "text/html",
  css: "text/css",
  js: "text/javascript",
  py: "text/plain",
  java: "text/plain",
  c: "text/plain",
  cpp: "text/plain",
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  apk: "application/vnd.android.package-archive",
  vcf: "text/vcard",
};

export const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif", "heic", "heif", "ico"]);
export const VIDEO_EXTS = new Set(["mp4", "mov", "webm", "mkv", "avi", "3gp", "m4v", "ogv"]);
export const AUDIO_EXTS = new Set(["mp3", "ogg", "opus", "m4a", "aac", "wav", "flac", "oga", "amr"]);
export const TEXT_EXTS = new Set(["txt", "md", "csv", "log", "json", "xml", "html", "css", "js", "py", "java", "c", "cpp"]);

export function getExtension(filename: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filename || "");
  return match ? match[1].toLowerCase() : "";
}

export function getMimeType(filename: string): string {
  return MIME_MAP[getExtension(filename)] || "application/octet-stream";
}

export function isSticker(filename: string): boolean {
  const base = filename.toLowerCase();
  return (base.startsWith("stk-") || base.endsWith(".webp")) && (IMAGE_EXTS.has(getExtension(filename)) || getExtension(filename) === "webp");
}

export function isVoiceNote(filename: string): boolean {
  const base = filename.toLowerCase();
  return base.startsWith("ptt-") || base.startsWith("aud-") || AUDIO_EXTS.has(getExtension(filename));
}

export function isGifVideo(filename: string): boolean {
  return filename.toLowerCase().startsWith("gif-") && VIDEO_EXTS.has(getExtension(filename));
}

export function classifyMediaType(filename: string): MediaType {
  const ext = getExtension(filename);
  if (isSticker(filename)) return "sticker";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (VIDEO_EXTS.has(ext)) return "video";
  if (AUDIO_EXTS.has(ext) || isVoiceNote(filename)) return "audio";
  if (ext === "pdf") return "pdf";
  if (TEXT_EXTS.has(ext)) return "text";
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx", "vcf", "apk"].includes(ext)) return "document";
  return "other";
}

