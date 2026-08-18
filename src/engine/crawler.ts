import { CrawlResult } from "./types";

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_DELAY_MS = 1000;

function normalizeUrl(raw: string, base: string): string | null {
  try {
    const url = new URL(raw, base);
    if (url.origin !== new URL(base).origin) return null;
    url.hash = "";
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return url.origin + path + url.search;
  } catch {
    return null;
  }
}

function isResourceUrl(url: string): boolean {
  const ext = new URL(url).pathname.split(".").pop()?.toLowerCase() || "";
  const skip = [
    "jpg", "jpeg", "png", "gif", "svg", "webp", "ico",
    "pdf", "zip", "rar", "tar", "gz",
    "mp3", "mp4", "avi", "mov", "wmv",
    "css", "js", "woff", "woff2", "ttf", "eot",
  ];
  return skip.includes(ext);
}

export async function crawl(
  startUrl: string,
  options: {
    maxPages?: number;
    maxDepth?: number;
    delayMs?: number;
    onProgress?: (found: number, current: string) => void;
  } = {}
): Promise<CrawlResult[]> {
  const maxPages = options.maxPages || DEFAULT_MAX_PAGES;
  const maxDepth = options.maxDepth || DEFAULT_MAX_DEPTH;
  const delayMs = options.delayMs || DEFAULT_DELAY_MS;

  const visited = new Set<string>();
  const results: CrawlResult[] = [];
  const queue: { url: string; depth: number }[] = [
    { url: normalizeUrl(startUrl, startUrl) || startUrl, depth: 0 },
  ];

  while (queue.length > 0 && results.length < maxPages) {
    const { url, depth } = queue.shift()!;
    const normalized = normalizeUrl(url, startUrl);
    if (!normalized || visited.has(normalized)) continue;
    if (depth > maxDepth) continue;
    if (isResourceUrl(normalized)) continue;

    visited.add(normalized);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(normalized, {
        signal: controller.signal,
        headers: {
          "User-Agent": "LotaAccessibilityAuditor/0.1",
          Accept: "text/html",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;

      const html = await response.text();
      const links = extractLinks(html, normalized);
      const result: CrawlResult = { url: normalized, depth, links };
      results.push(result);

      options.onProgress?.(results.length, normalized);

      if (depth < maxDepth) {
        for (const link of links) {
          const n = normalizeUrl(link, normalized);
          if (n && !visited.has(n) && !isResourceUrl(n)) {
            queue.push({ url: n, depth: depth + 1 });
          }
        }
      }

      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } catch {
      continue;
    }
  }

  return results;
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    const normalized = normalizeUrl(href, baseUrl);
    if (normalized) links.push(normalized);
  }
  return [...new Set(links)];
}
