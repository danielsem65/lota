import { NextRequest, NextResponse } from "next/server";
import {
  createScan,
  updateScanStatus,
  createPage,
  getPageByurl,
  updatePageStatus,
  insertViolation,
} from "@/db/queries";
import { crawl } from "@/engine/crawler";
import { auditPage } from "@/engine/auditor";
import { calculateScore } from "@/engine/scorer";
import { chromium } from "playwright";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const scan = createScan(url);
    updateScanStatus(scan.id, "crawling");

    let crawlResults;
    try {
      crawlResults = await crawl(url, {
        maxPages: 50,
        maxDepth: 3,
        delayMs: 500,
      });
    } catch (crawlError) {
      updateScanStatus(scan.id, "error");
      return NextResponse.json(
        { error: "Failed to crawl URL", detail: String(crawlError) },
        { status: 500 }
      );
    }

    const urls = crawlResults.map((r) => r.url);
    updateScanStatus(scan.id, "auditing", { pagesFound: urls.length });

    for (const u of urls) {
      createPage(scan.id, u, crawlResults.find((r) => r.url === u)?.depth || 0);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    let pagesAudited = 0;

    try {
      for (const u of urls) {
        const pageRecord = getPageByurl(scan.id, u);
        if (!pageRecord) continue;

        try {
          const result = await auditPage(page, u);
          updatePageStatus(pageRecord.id, "audited", result.score);

          for (const v of result.violations) {
            insertViolation(scan.id, pageRecord.id, v);
          }

          pagesAudited++;
          updateScanStatus(scan.id, "auditing", { pagesAudited });
        } catch {
          updatePageStatus(pageRecord.id, "error");
        }
      }
    } finally {
      await context.close();
      await browser.close();
    }

    updateScanStatus(scan.id, "done", {
      pagesAudited,
      pagesFound: urls.length,
    });

    return NextResponse.json({
      scanId: scan.id,
      status: "done",
      pagesAudited,
      pagesFound: urls.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(error) },
      { status: 500 }
    );
  }
}
