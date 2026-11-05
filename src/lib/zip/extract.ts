import JSZip from "jszip";
import { Conversation, ProcessingState } from "@/types/chat";
import { getExtension, IMAGE_EXTS, VIDEO_EXTS, AUDIO_EXTS, TEXT_EXTS } from "../utils/mime";
import { isWhatsAppChatText } from "../parser/detect";
import { parseChatTranscript } from "../parser/parse-chat";
import { mediaRegistry } from "../storage/media-registry";
import { chatCache } from "../storage/chat-cache";
import { inspectFile, isZipHeader, isTextBuffer } from "../utils/file-signatures";

export async function extractAndProcessFiles(
  fileList: File[] | FileList,
  onProgress?: (state: ProcessingState) => void
): Promise<Conversation[]> {
  const files = Array.from(fileList);
  if (files.length === 0) return [];

  // Reset media registry and chat cache
  mediaRegistry.clear();
  chatCache.clear();

  onProgress?.({
    stage: "reading",
    progress: 10,
    message: `Indexing ${files.length} selected files...`,
    totalFiles: files.length,
    processedFiles: 0,
    chatCount: 0,
  });

  const txtEntries: { name: string; text: string }[] = [];
  const zipFiles: File[] = [];

  // Pass 1: Identify loose files and primary zips
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    let name = f.name;

    // If the file is named "_chat.txt" or "_chat" from a folder upload, use enclosing folder name
    if ((name === "_chat.txt" || name === "_chat") && f.webkitRelativePath) {
      const parts = f.webkitRelativePath.split("/");
      if (parts.length > 1) {
        name = parts[parts.length - 2];
      }
    }

    const ext = getExtension(name);

    if (ext === "zip") {
      zipFiles.push(f);
    } else if (ext === "txt") {
      const text = await f.text();
      if (isWhatsAppChatText(text, name)) {
        txtEntries.push({ name, text });
      } else {
        // Attachment text file registered for lazy on-demand view
        mediaRegistry.registerFile(name, f);
      }
    } else if (
      IMAGE_EXTS.has(ext) ||
      VIDEO_EXTS.has(ext) ||
      AUDIO_EXTS.has(ext) ||
      TEXT_EXTS.has(ext) ||
      ext === "pdf"
    ) {
      // Register loose media without loading it into RAM!
      mediaRegistry.registerFile(name, f);
    } else {
      // Extensionless or unrecognized extension file: sniff magic bytes
      const inspection = await inspectFile(f);
      if (inspection.kind === "zip") {
        zipFiles.push(f);
      } else if (inspection.kind === "chat-text") {
        txtEntries.push({ name, text: inspection.text });
      } else if (inspection.kind === "media" || inspection.kind === "text") {
        mediaRegistry.registerFile(name, f);
      }
    }

    onProgress?.({
      stage: "reading",
      progress: Math.min(45, Math.round(((i + 1) / files.length) * 40)),
      message: `Indexed file ${i + 1} of ${files.length}...`,
      totalFiles: files.length,
      processedFiles: i + 1,
      chatCount: txtEntries.length,
    });
  }

  // Pass 2: Inspect ZIP files (lazily indexes media; only decompresses chat text)
  if (zipFiles.length > 0) {
    onProgress?.({
      stage: "extracting",
      progress: 50,
      message: `Scanning ${zipFiles.length} WhatsApp archive(s)...`,
      totalFiles: files.length,
      processedFiles: files.length,
      chatCount: txtEntries.length,
    });

    for (let zi = 0; zi < zipFiles.length; zi++) {
      const zf = zipFiles[zi];
      try {
        const zip = await JSZip.loadAsync(zf);
        const entries = Object.entries(zip.files);

        for (const [path, entry] of entries) {
          if (entry.dir) continue;
          const baseName = path.split("/").pop() || "";
          let ext = getExtension(baseName);
          let isNestedZip = ext === "zip";
          let isTxt = ext === "txt";

          // If entry inside zip has no extension, sniff header bytes
          if (!ext) {
            try {
              const sample = await entry.async("uint8array");
              if (isZipHeader(sample)) {
                isNestedZip = true;
              } else if (isTextBuffer(sample.subarray(0, Math.min(sample.length, 512)))) {
                isTxt = true;
              }
            } catch {}
          }

          // Check for nested ZIP
          if (isNestedZip) {
            try {
              const nestedBlob = await entry.async("blob");
              const nestedZip = await JSZip.loadAsync(nestedBlob);
              for (const [nestedPath, nestedEntry] of Object.entries(nestedZip.files)) {
                if (nestedEntry.dir) continue;
                const nestedBaseName = nestedPath.split("/").pop() || "";
                let nestedExt = getExtension(nestedBaseName);
                let nestedIsTxt = nestedExt === "txt";

                if (!nestedExt) {
                  try {
                    const nestedSample = await nestedEntry.async("uint8array");
                    if (isTextBuffer(nestedSample.subarray(0, Math.min(nestedSample.length, 512)))) {
                      nestedIsTxt = true;
                    }
                  } catch {}
                }

                if (nestedIsTxt) {
                  const text = await nestedEntry.async("string");
                  let effectiveNestedName = nestedBaseName;
                  if ((nestedBaseName === "_chat.txt" || nestedBaseName === "_chat") && baseName) {
                    effectiveNestedName = baseName;
                  }
                  if (isWhatsAppChatText(text, effectiveNestedName)) {
                    txtEntries.push({ name: effectiveNestedName, text });
                  } else {
                    const blob = await nestedEntry.async("blob");
                    mediaRegistry.registerBlob(nestedBaseName, blob);
                  }
                } else {
                  // Register nested zip entry
                  mediaRegistry.registerZipEntry(nestedBaseName, nestedEntry);
                }
              }
            } catch (err) {
              console.warn("Could not inspect nested zip:", baseName, err);
            }
            continue;
          }

          if (isTxt) {
            const text = await entry.async("string");
            let effectiveName = baseName;
            if ((baseName === "_chat.txt" || baseName === "_chat") && zf.name) {
              effectiveName = zf.name;
            }
            if (isWhatsAppChatText(text, effectiveName)) {
              txtEntries.push({ name: effectiveName, text });
            } else {
              // Attachment text file registered lazily
              mediaRegistry.registerZipEntry(baseName, entry);
            }
          } else {
            // Lazy pointer registration: 0 BYTES of RAM consumed!
            mediaRegistry.registerZipEntry(baseName, entry);
          }
        }
      } catch (err) {
        console.error("Failed to unpack zip file:", zf.name, err);
      }

      onProgress?.({
        stage: "extracting",
        progress: 50 + Math.round(((zi + 1) / zipFiles.length) * 35),
        message: `Scanned archive ${zi + 1} of ${zipFiles.length}...`,
        totalFiles: files.length,
        processedFiles: files.length,
        chatCount: txtEntries.length,
      });
    }
  }

  // Pass 3: Deduplicate and parse conversations
  onProgress?.({
    stage: "parsing",
    progress: 90,
    message: "Building conversation threads...",
    totalFiles: files.length,
    processedFiles: files.length,
    chatCount: txtEntries.length,
  });

  const seenChats = new Set<string>();
  const parsedRaw: { name: string; text: string }[] = [];

  for (const item of txtEntries) {
    const dedupeKey = item.name + "::" + item.text.slice(0, 150);
    if (seenChats.has(dedupeKey)) continue;
    seenChats.add(dedupeKey);
    parsedRaw.push(item);
  }

  // Guard: if no valid WhatsApp transcripts were identified
  if (parsedRaw.length === 0) {
    onProgress?.({
      stage: "error",
      progress: 0,
      message: "No valid WhatsApp chat transcripts found.",
      totalFiles: files.length,
      processedFiles: files.length,
      chatCount: 0,
      error: "No WhatsApp chats found. Please select a valid WhatsApp exported .zip archive or backup folder.",
    });
    return [];
  }

  // First pass: discover user's identity via consensus across all chats & deletion fingerprints
  const identityVotes: Record<string, number> = {};

  for (const item of parsedRaw) {
    const chat = parseChatTranscript(item.text, item.name, {});
    if (chat && chat.myName) {
      // 1-on-1 chats and deletion fingerprints yield myName
      // Give group deletion fingerprints strong weight (5), 1-on-1 chats (2)
      const weight = chat.isGroup ? 5 : 2;
      identityVotes[chat.myName] = (identityVotes[chat.myName] || 0) + weight;
    }
  }

  let discoveredUserName: string | null = null;
  let maxVotes = 0;
  for (const [name, votes] of Object.entries(identityVotes)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      discoveredUserName = name;
    }
  }

  // Fallback to localStorage if this upload didn't contain sufficient clues
  if (!discoveredUserName && typeof window !== "undefined") {
    try {
      discoveredUserName = localStorage.getItem("wbv_user_identity");
    } catch {}
  }

  // Persist winning identity for future uploads
  if (discoveredUserName && typeof window !== "undefined") {
    try {
      localStorage.setItem("wbv_user_identity", discoveredUserName);
    } catch {}
  }

  // Second pass: parse all chats with discovered user identity
  const conversations: Conversation[] = [];
  for (let i = 0; i < parsedRaw.length; i++) {
    const item = parsedRaw[i];
    const chat = parseChatTranscript(item.text, item.name, {}, discoveredUserName);
    if (chat && chat.messages.length > 0) {
      chat.rawText = item.text;
      // Store in LRU cache (capped at MAX_CACHED_CHATS)
      chatCache.set(chat.id, chat.messages);
      // Keep only lightweight conversation in list state (0 RAM overhead)
      conversations.push({
        ...chat,
        messages: [],
      });
    }
  }

  // Sort by newest activity
  conversations.sort((a, b) => b.lastTimestamp - a.lastTimestamp);

  onProgress?.({
    stage: "ready",
    progress: 100,
    message: `Loaded ${conversations.length} conversation(s).`,
    totalFiles: files.length,
    processedFiles: files.length,
    chatCount: conversations.length,
  });

  return conversations;
}
