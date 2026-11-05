import { isWhatsAppChatText } from "../parser/detect";

export type InferredFileKind =
  | { kind: "zip" }
  | { kind: "chat-text"; text: string }
  | { kind: "media"; mime: string; inferredExt: string }
  | { kind: "text"; text: string }
  | { kind: "unknown" };

/**
 * Checks if a byte array starts with the ZIP magic bytes 'PK\x03\x04', 'PK\x05\x06', or 'PK\x07\x08'.
 */
export function isZipHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  return (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (
      (bytes[2] === 0x03 && bytes[3] === 0x04) ||
      (bytes[2] === 0x05 && bytes[3] === 0x06) ||
      (bytes[2] === 0x07 && bytes[3] === 0x08)
    )
  );
}

/**
 * Checks if any File or Blob is a ZIP archive by reading only the first 4 bytes.
 * Zero RAM overhead, completes in < 0.2ms.
 */
export async function isZipFile(file: File | Blob): Promise<boolean> {
  if (file.size < 4) return false;
  try {
    const slice = file.slice(0, 4);
    const buffer = await slice.arrayBuffer();
    return isZipHeader(new Uint8Array(buffer));
  } catch {
    return false;
  }
}

/**
 * Detects media MIME type from binary magic bytes.
 */
export function detectMediaSignature(bytes: Uint8Array): { mime: string; ext: string } | null {
  if (bytes.length < 4) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return { mime: "image/gif", ext: "gif" };
  }

  // WebP: RIFF .... WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  // PDF: %PDF (25 50 44 46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { mime: "application/pdf", ext: "pdf" };
  }

  // OGG / Opus voice notes: OggS (4F 67 67 53)
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return { mime: "audio/ogg", ext: "opus" };
  }

  // MP3: ID3 or FF FB / FF F3
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] === 0xfb || bytes[1] === 0xf3))
  ) {
    return { mime: "audio/mpeg", ext: "mp3" };
  }

  // MP4 / MOV: ....ftyp
  if (
    bytes.length >= 8 &&
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    return { mime: "video/mp4", ext: "mp4" };
  }

  return null;
}

/**
 * Checks if a byte buffer is plain UTF-8 text (no binary null bytes in sample).
 */
export function isTextBuffer(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0x00) {
      return false; // Binary file
    }
  }
  return true;
}

/**
 * Deeply inspects an unknown or extensionless file by reading only the first 4KB.
 * Accurately classifies whether the file is a ZIP, WhatsApp transcript, media, or attachment.
 */
export async function inspectFile(file: File): Promise<InferredFileKind> {
  if (file.size === 0) return { kind: "unknown" };

  try {
    const sampleSize = Math.min(file.size, 4096);
    const slice = file.slice(0, sampleSize);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // 1. Is it a ZIP archive?
    if (isZipHeader(bytes)) {
      return { kind: "zip" };
    }

    // 2. Is it a recognized binary media file (image, audio, video, pdf)?
    const mediaSig = detectMediaSignature(bytes);
    if (mediaSig) {
      return { kind: "media", mime: mediaSig.mime, inferredExt: mediaSig.ext };
    }

    // 3. Is it text?
    if (isTextBuffer(bytes)) {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const sampleText = decoder.decode(bytes);

      if (isWhatsAppChatText(sampleText, file.name)) {
        // If sample matches WhatsApp timestamps, read the full text
        const fullText = await file.text();
        return { kind: "chat-text", text: fullText };
      }

      const fullText = await file.text();
      return { kind: "text", text: fullText };
    }

    return { kind: "unknown" };
  } catch {
    return { kind: "unknown" };
  }
}

