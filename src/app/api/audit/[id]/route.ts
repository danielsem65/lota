import { NextRequest, NextResponse } from "next/server";
import {
  getScan,
  getPagesByScan,
  getViolationsByScan,
} from "@/db/queries";
import { buildScanResult } from "@/engine/scorer";
import { generateJsonReport, generateHtmlReport } from "@/engine/reporter";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scan = getScan(id);

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  if (scan.status !== "done") {
    return NextResponse.json({
      scanId: scan.id,
      status: scan.status,
      pagesFound: scan.pagesFound,
      pagesAudited: scan.pagesAudited,
    });
  }

  const pages = getPagesByScan(id);
  const violations = getViolationsByScan(id);

  const pageResults = pages.map((p) => ({
    url: p.url,
    violations: violations
      .filter((v) => v.pageId === p.id)
      .map((v) => ({
        ruleId: v.ruleId,
        severity: v.severity as
          | "critical"
          | "serious"
          | "moderate"
          | "minor",
        wcagCriteria: v.wcagCriteria.split(",").filter(Boolean),
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        htmlSnippet: v.htmlSnippet,
        cssSelector: v.cssSelector,
        fixSuggestion: v.fixSuggestion,
      })),
    passes: 0,
    incomplete: 0,
    score: p.score || 100,
  }));

  const scanResult = buildScanResult(scan.id, scan.url, pageResults);

  const format = request.nextUrl.searchParams.get("format");
  if (format === "html") {
    const html = generateHtmlReport(scanResult);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  }

  return NextResponse.json(scanResult);
}
