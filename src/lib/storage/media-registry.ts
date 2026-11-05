import JSZip from "jszip";
import { getMimeType } from "../utils/mime";

export type MediaSource =
  | { type: "file"; file: File }
  | { type: "zip-entry"; entry: JSZip.JSZipObject }
  | { type: "blob"; blob: Blob };

class MediaRegistry {
  private sources = new Map<string, MediaSource>();
  // LRU Cache: filename -> objectUrl (maintains insertion order for eviction)
  private lruCache = new Map<string, string>();
  private readonly MAX_CACHE_SIZE = 50;

  registerFile(filename: string, file: File) {
    this.sources.set(filename.toLowerCase(), { type: "file", file });
  }

  registerZipEntry(filename: string, entry: JSZip.JSZipObject) {
    this.sources.set(filename.toLowerCase(), { type: "zip-entry", entry });
  }

  registerBlob(filename: string, blob: Blob) {
    this.sources.set(filename.toLowerCase(), { type: "blob", blob });
  }

  hasMedia(filename: string): boolean {
    return this.sources.has(filename.toLowerCase());
  }

  async getMediaUrl(filename: string): Promise<string | undefined> {
    const key = filename.toLowerCase();

    // 1. Check if already in LRU cache
    if (this.lruCache.has(key)) {
      const existingUrl = this.lruCache.get(key)!;
      // Refresh position in Map to make it most recently used
      this.lruCache.delete(key);
      this.lruCache.set(key, existingUrl);
      return existingUrl;
    }

    // 2. Not in cache; check if registered
    const source = this.sources.get(key);
    if (!source) return undefined;

    try {
      let blob: Blob;
      const mime = getMimeType(filename);

      if (source.type === "file") {
        blob = source.file;
      } else if (source.type === "blob") {
        blob = source.blob;
      } else {
        // Decompress on-demand from zip
        const rawBlob = await source.entry.async("blob");
        blob = rawBlob.type && rawBlob.type !== "application/octet-stream"
          ? rawBlob
          : rawBlob.slice(0, rawBlob.size, mime);
      }

      // Ensure proper MIME type if missing
      if (!blob.type || blob.type === "application/octet-stream") {
        blob = blob.slice(0, blob.size, mime);
      }

      // Evict oldest if cache is full
      if (this.lruCache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.lruCache.keys().next().value;
        if (oldestKey) {
          const oldUrl = this.lruCache.get(oldestKey);
          if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
          }
          this.lruCache.delete(oldestKey);
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      this.lruCache.set(key, objectUrl);
      return objectUrl;
    } catch (err) {
      console.warn("Failed to extract on-demand media for:", filename, err);
      return undefined;
    }
  }

  clear() {
    for (const url of this.lruCache.values()) {
      URL.revokeObjectURL(url);
    }
    this.lruCache.clear();
    this.sources.clear();
  }

  get stats() {
    return {
      registeredFiles: this.sources.size,
      activeCachedUrls: this.lruCache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
    };
  }
}

export const mediaRegistry = new MediaRegistry();

