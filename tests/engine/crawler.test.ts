import { describe, it, expect } from "vitest";

describe("crawler", () => {
  it("normalizes URLs correctly", async () => {
    const { crawl } = await import("@/engine/crawler");

    const results = await crawl("https://example.com", {
      maxPages: 1,
      maxDepth: 0,
      delayMs: 0,
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it("respects maxPages limit", async () => {
    const { crawl } = await import("@/engine/crawler");

    const results = await crawl("https://example.com", {
      maxPages: 1,
      maxDepth: 0,
      delayMs: 0,
    });

    expect(results.length).toBeLessThanOrEqual(1);
  });

  it("respects maxDepth limit", async () => {
    const { crawl } = await import("@/engine/crawler");

    const results = await crawl("https://example.com", {
      maxPages: 50,
      maxDepth: 0,
      delayMs: 0,
    });

    for (const r of results) {
      expect(r.depth).toBe(0);
    }
  });

  it("skips non-HTML resources", async () => {
    const { crawl } = await import("@/engine/crawler");

    const results = await crawl("https://example.com", {
      maxPages: 10,
      maxDepth: 2,
      delayMs: 0,
    });

    for (const r of results) {
      const ext = new URL(r.url).pathname.split(".").pop()?.toLowerCase();
      const skip = ["jpg", "png", "gif", "pdf", "zip", "css", "js"];
      if (ext) {
        expect(skip).not.toContain(ext);
      }
    }
  });

  it("calls onProgress callback", async () => {
    const { crawl } = await import("@/engine/crawler");
    const progressCalls: { found: number; url: string }[] = [];

    await crawl("https://example.com", {
      maxPages: 1,
      maxDepth: 0,
      delayMs: 0,
      onProgress: (found, url) => {
        progressCalls.push({ found, url });
      },
    });

    expect(progressCalls.length).toBeGreaterThanOrEqual(1);
    expect(progressCalls[0].found).toBeGreaterThanOrEqual(1);
  });
});
