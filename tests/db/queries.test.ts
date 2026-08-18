import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const TEST_DB = path.join(process.cwd(), "data", "test-lota.db");

beforeAll(() => {
  process.env.DATABASE_PATH = TEST_DB;
  const dir = path.dirname(TEST_DB);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  const journal = TEST_DB + "-journal";
  const wal = TEST_DB + "-wal";
  const shm = TEST_DB + "-shm";
  if (fs.existsSync(journal)) fs.unlinkSync(journal);
  if (fs.existsSync(wal)) fs.unlinkSync(wal);
  if (fs.existsSync(shm)) fs.unlinkSync(shm);
});

describe("database operations", () => {
  it("creates and retrieves a scan", async () => {
    const { createScan, getScan } = await import("@/db/queries");
    const scan = createScan("https://test.com");

    expect(scan.id).toBeDefined();
    expect(scan.url).toBe("https://test.com");
    expect(scan.status).toBe("pending");

    const retrieved = getScan(scan.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.id).toBe(scan.id);
    expect(retrieved!.url).toBe("https://test.com");
  });

  it("updates scan status", async () => {
    const { createScan, updateScanStatus, getScan } = await import("@/db/queries");
    const scan = createScan("https://update-test.com");

    updateScanStatus(scan.id, "crawling");
    expect(getScan(scan.id)!.status).toBe("crawling");

    updateScanStatus(scan.id, "done", { score: 85, pagesFound: 5, pagesAudited: 5 });
    const updated = getScan(scan.id)!;
    expect(updated.status).toBe("done");
    expect(updated.score).toBe(85);
    expect(updated.pagesFound).toBe(5);
    expect(updated.completedAt).not.toBeNull();
  });

  it("creates and retrieves pages", async () => {
    const { createScan, createPage, getPageByurl, getPagesByScan } = await import("@/db/queries");
    const scan = createScan("https://pages-test.com");

    createPage(scan.id, "https://pages-test.com", 0);
    createPage(scan.id, "https://pages-test.com/about", 1);
    createPage(scan.id, "https://pages-test.com/contact", 1);

    const pages = getPagesByScan(scan.id);
    expect(pages).toHaveLength(3);

    const page = getPageByurl(scan.id, "https://pages-test.com/about");
    expect(page).not.toBeNull();
    expect(page!.depth).toBe(1);
  });

  it("inserts and retrieves violations", async () => {
    const { createScan, createPage, insertViolation, getViolationsByScan } = await import("@/db/queries");
    const scan = createScan("https://violations-test.com");
    const page = createPage(scan.id, "https://violations-test.com", 0);

    insertViolation(scan.id, page.id, {
      ruleId: "image-alt",
      severity: "critical",
      wcagCriteria: ["wcag2a", "wcag111"],
      description: "Images must have alt text",
      help: "Add alt attribute",
      helpUrl: "https://deque.com",
      htmlSnippet: '<img src="photo.jpg">',
      cssSelector: "img",
      fixSuggestion: "Add alt='description'",
    });

    const violations = getViolationsByScan(scan.id);
    expect(violations).toHaveLength(1);
    expect(violations[0].ruleId).toBe("image-alt");
    expect(violations[0].severity).toBe("critical");
  });

  it("returns recent scans", async () => {
    const { createScan, getRecentScans } = await import("@/db/queries");
    createScan("https://recent1.com");
    createScan("https://recent2.com");

    const recent = getRecentScans(10);
    expect(recent.length).toBeGreaterThanOrEqual(2);
  });
});
