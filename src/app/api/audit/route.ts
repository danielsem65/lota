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
import { auditHtml } from "@/engine/auditor";

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

    updateScanStatus(scan.id, "auditing", { pagesFound: crawlResults.length });

    for (const r of crawlResults) {
      createPage(scan.id, r.url, r.depth);
    }

    let pagesAudited = 0;

    for (const r of crawlResults) {
      const pageRecord = getPageByurl(scan.id, r.url);
      if (!pageRecord) continue;

      try {
        const result = await auditHtml(r.url, r.html);
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

    updateScanStatus(scan.id, "done", {
      pagesAudited,
      pagesFound: crawlResults.length,
    });

    return NextResponse.json({
      scanId: scan.id,
      status: "done",
      pagesAudited,
      pagesFound: crawlResults.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error", detail: String(error) },
      { status: 500 }
    );
  }
}
