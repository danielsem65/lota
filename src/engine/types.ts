export interface CrawlResult {
  url: string;
  depth: number;
  links: string[];
}

export interface AuditViolation {
  ruleId: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  wcagCriteria: string[];
  description: string;
  help: string;
  helpUrl: string;
  htmlSnippet: string;
  cssSelector: string;
  fixSuggestion: string;
}

export interface PageAuditResult {
  url: string;
  violations: AuditViolation[];
  passes: number;
  incomplete: number;
  score: number;
}

export interface ScanResult {
  id: string;
  url: string;
  pages: PageAuditResult[];
  totalViolations: number;
  bySeverity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  score: number;
  pagesFound: number;
  pagesAudited: number;
}

export type ScanStatus =
  | "pending"
  | "crawling"
  | "auditing"
  | "scoring"
  | "done"
  | "error";

export interface ScanRecord {
  id: string;
  url: string;
  status: ScanStatus;
  score: number | null;
  pagesFound: number | null;
  pagesAudited: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface PageRecord {
  id: string;
  scanId: string;
  url: string;
  depth: number;
  status: "pending" | "audited" | "error";
  score: number | null;
  createdAt: string;
}

export interface ViolationRecord {
  id: number;
  scanId: string;
  pageId: string;
  ruleId: string;
  severity: string;
  wcagCriteria: string;
  description: string;
  help: string;
  helpUrl: string;
  htmlSnippet: string;
  cssSelector: string;
  fixSuggestion: string;
  createdAt: string;
}
