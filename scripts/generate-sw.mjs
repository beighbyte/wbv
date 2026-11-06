import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.resolve("out");

async function getFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? getFiles(entryPath) : [entryPath];
    }),
  );
  return nestedFiles.flat();
}

const files = (await getFiles(outputDirectory))
  .filter((file) => path.relative(outputDirectory, file) !== "sw.js")
  .sort();
if (files.length === 0) {
  throw new Error(`No files found in static export directory: ${outputDirectory}`);
}

const cacheVersion = createHash("sha256");
for (const file of files) {
  cacheVersion.update(path.relative(outputDirectory, file));
  cacheVersion.update("\0");
  cacheVersion.update(await readFile(file));
}
const cacheName = `wbv-shell-${cacheVersion.digest("hex").slice(0, 12)}`;

const precacheUrls = files.map((file) => {
  const relativePath = path.relative(outputDirectory, file);
  return `/${relativePath.split(path.sep).map(encodeURIComponent).join("/")}`;
});

precacheUrls.push("/");

const serviceWorker = `
const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(precacheUrls)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("wbv-shell-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).catch((error) => {
          if (request.mode === "navigate") {
            return cache.match("/");
          }
          throw error;
        });
      }),
    ),
  );
});
`;

await writeFile(path.join(outputDirectory, "sw.js"), serviceWorker.trimStart());
console.log(`Generated service worker with ${precacheUrls.length} precache URLs.`);
