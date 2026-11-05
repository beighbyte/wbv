// Manages browser Object URLs to avoid memory leaks during heavy media sessions

class BlobManager {
  private urls = new Set<string>();

  create(blob: Blob | File): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revoke(url: string) {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  revokeAll() {
    for (const url of this.urls) {
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }

  get count(): number {
    return this.urls.size;
  }
}

export const blobManager = new BlobManager();

