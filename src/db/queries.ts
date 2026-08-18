import { getDb } from "./index";
import {
  ScanRecord,
  PageRecord,
  ViolationRecord,
  ScanStatus,
  AuditViolation,
} from "@/engine/types";
import { v4 as uuidv4 } from "uuid";

export function createScan(url: string): ScanRecord {
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    "INSERT INTO scans (id, url, status) VALUES (?, ?, 'pending')"
  ).run(id, url);
  return getScan(id)!;
}

export function getScan(id: string): ScanRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM scans WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    url: row.url as string,
    status: row.status as ScanStatus,
    score: row.score as number | null,
    pagesFound: row.pages_found as number | null,
    pagesAudited: row.pages_audited as number | null,
    createdAt: row.created_at as string,
    completedAt: row.completed_at as string | null,
  };
}

export function updateScanStatus(
  id: string,
  status: ScanStatus,
  extra?: { score?: number; pagesFound?: number; pagesAudited?: number }
): void {
  const db = getDb();
  if (extra) {
    db.prepare(
      "UPDATE scans SET status = ?, score = COALESCE(?, score), pages_found = COALESCE(?, pages_found), pages_audited = COALESCE(?, pages_audited), completed_at = CASE WHEN ? IN ('done','error') THEN datetime('now') ELSE completed_at END WHERE id = ?"
    ).run(status, extra.score ?? null, extra.pagesFound ?? null, extra.pagesAudited ?? null, status, id);
  } else {
    db.prepare("UPDATE scans SET status = ? WHERE id = ?").run(status, id);
  }
}

export function createPage(
  scanId: string,
  url: string,
  depth: number
): PageRecord {
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    "INSERT INTO pages (id, scan_id, url, depth) VALUES (?, ?, ?, ?)"
  ).run(id, scanId, url, depth);
  return { id, scanId, url, depth, status: "pending", score: null, createdAt: new Date().toISOString() };
}

export function updatePageStatus(
  id: string,
  status: "audited" | "error",
  score?: number
): void {
  const db = getDb();
  db.prepare("UPDATE pages SET status = ?, score = ? WHERE id = ?").run(
    status,
    score ?? null,
    id
  );
}

export function getPageByurl(scanId: string, url: string): PageRecord | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM pages WHERE scan_id = ? AND url = ?").get(scanId, url) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: row.id as string,
    scanId: row.scan_id as string,
    url: row.url as string,
    depth: row.depth as number,
    status: row.status as "pending" | "audited" | "error",
    score: row.score as number | null,
    createdAt: row.created_at as string,
  };
}

export function insertViolation(
  scanId: string,
  pageId: string,
  violation: AuditViolation
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO violations (scan_id, page_id, rule_id, severity, wcag_criteria, description, help, help_url, html_snippet, css_selector, fix_suggestion)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    scanId,
    pageId,
    violation.ruleId,
    violation.severity,
    violation.wcagCriteria.join(","),
    violation.description,
    violation.help,
    violation.helpUrl,
    violation.htmlSnippet,
    violation.cssSelector,
    violation.fixSuggestion
  );
}

export function getViolationsByScan(scanId: string): ViolationRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM violations WHERE scan_id = ?")
    .all(scanId) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as number,
    scanId: r.scan_id as string,
    pageId: r.page_id as string,
    ruleId: r.rule_id as string,
    severity: r.severity as string,
    wcagCriteria: r.wcag_criteria as string,
    description: r.description as string,
    help: r.help as string,
    helpUrl: r.help_url as string,
    htmlSnippet: r.html_snippet as string,
    cssSelector: r.css_selector as string,
    fixSuggestion: r.fix_suggestion as string,
    createdAt: r.created_at as string,
  }));
}

export function getPagesByScan(scanId: string): PageRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pages WHERE scan_id = ? ORDER BY depth, url")
    .all(scanId) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    scanId: r.scan_id as string,
    url: r.url as string,
    depth: r.depth as number,
    status: r.status as "pending" | "audited" | "error",
    score: r.score as number | null,
    createdAt: r.created_at as string,
  }));
}

export function getRecentScans(limit: number = 20): ScanRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM scans ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    url: r.url as string,
    status: r.status as ScanStatus,
    score: r.score as number | null,
    pagesFound: r.pages_found as number | null,
    pagesAudited: r.pages_audited as number | null,
    createdAt: r.created_at as string,
    completedAt: r.completed_at as string | null,
  }));
}
