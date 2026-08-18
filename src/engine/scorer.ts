import { AuditViolation, PageAuditResult, ScanResult } from "./types";
import { v4 as uuidv4 } from "uuid";

export function calculateScore(violations: AuditViolation[]): number {
  let penalty = 0;
  for (const v of violations) {
    switch (v.severity) {
      case "critical": penalty += 10; break;
      case "serious": penalty += 5; break;
      case "moderate": penalty += 2; break;
      case "minor": penalty += 1; break;
    }
  }
  return Math.max(0, 100 - penalty);
}

export function countBySeverity(violations: AuditViolation[]) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) {
    if (v.severity in counts) {
      counts[v.severity as keyof typeof counts]++;
    }
  }
  return counts;
}

export function buildScanResult(
  scanId: string,
  startUrl: string,
  pageResults: PageAuditResult[]
): ScanResult {
  const allViolations = pageResults.flatMap((p) => p.violations);
  const bySeverity = countBySeverity(allViolations);

  const averageScore =
    pageResults.length > 0
      ? Math.round(
          pageResults.reduce((sum, p) => sum + p.score, 0) / pageResults.length
        )
      : 100;

  return {
    id: scanId,
    url: startUrl,
    pages: pageResults,
    totalViolations: allViolations.length,
    bySeverity,
    score: averageScore,
    pagesFound: pageResults.length,
    pagesAudited: pageResults.length,
  };
}

export function generateScanId(): string {
  return uuidv4();
}
