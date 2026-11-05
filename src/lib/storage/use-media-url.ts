"use client";

import { useEffect, useState } from "react";
import { mediaRegistry } from "./media-registry";

export function useMediaUrl(filename: string | null | undefined, initialUrl?: string) {
  const [url, setUrl] = useState<string | undefined>(initialUrl);
  const [loading, setLoading] = useState<boolean>(!initialUrl && Boolean(filename));

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      setLoading(false);
      return;
    }

    if (!filename) {
      setUrl(undefined);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    mediaRegistry.getMediaUrl(filename).then((resolved) => {
      if (isMounted) {
        setUrl(resolved);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [filename, initialUrl]);

  return { url, loading };
}

