import { chromium, type Browser, type Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { AuditViolation, PageAuditResult } from "./types";

const SEVERITY_MAP: Record<string, AuditViolation["severity"]> = {
  critical: "critical",
  serious: "serious",
  moderate: "moderate",
  minor: "minor",
};

const FIX_SUGGESTIONS: Record<string, string> = {
  "color-contrast":
    "Increase the contrast ratio between foreground and background colors. WCAG AA requires 4.5:1 for normal text and 3:1 for large text. Use a contrast checker tool.",
  "image-alt":
    "Add descriptive alt text to the image: <img alt='Description of image' ...>. For decorative images use alt=''.",
  "label":
    "Associate a visible label with the form input using <label for='inputId'>Label</label> or aria-label attribute.",
  "link-name":
    "Ensure links have discernible text. Add text content, aria-label, or aria-labelledby to the link.",
  "button-name":
    "Ensure buttons have discernible text. Add text content, aria-label, or use aria-labelledby.",
  "html-has-lang":
    "Add a lang attribute to the <html> element: <html lang='en'>.",
  "document-title":
    "Add a descriptive <title> element inside <head>.",
  "meta-viewport":
    "Avoid disabling user scaling. Remove maximum-scale=1 and user-scalable=no from the viewport meta tag.",
  "heading-order":
    "Ensure heading levels increase by one (h1 → h2 → h3). Do not skip heading levels.",
  "region":
    "Ensure all page content is contained within landmark regions (header, nav, main, footer).",
  "aria-allowed-attr":
    "Check that ARIA attributes are valid for the element's role.",
  "tabindex":
    "Avoid positive tabindex values. Use tabindex='0' for focusable elements and tabindex='-1' for programmatically focusable elements.",
  "duplicate-id":
    "Ensure all id attributes are unique within the page.",
  "valid-lang":
    "Ensure the lang attribute value is a valid ISO 639 language code.",
  "frame-title":
    "Add a descriptive title attribute to iframe elements.",
  "input-image-alt":
    "Add alt text to input type='image' elements.",
  "td-headers-attr":
    "Ensure table headers use the scope attribute or id/headers attributes.",
  "th-has-data-cells":
    "Ensure <th> elements have associated data cells.",
  "target-size":
    "Ensure touch targets are at least 24x24 CSS pixels (WCAG 2.2 SC 2.5.8).",
};

function getFixSuggestion(ruleId: string, description: string): string {
  if (FIX_SUGGESTIONS[ruleId]) return FIX_SUGGESTIONS[ruleId];
  return `Fix: ${description}. See WCAG guidelines for detailed remediation steps.`;
}

export async function auditPage(
  page: Page,
  url: string
): Promise<PageAuditResult> {
  const violations: AuditViolation[] = [];
  let passes = 0;
  let incomplete = 0;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);

    const axeResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    passes = axeResults.passes.length;
    incomplete = axeResults.incomplete.length;

    for (const v of axeResults.violations) {
      for (const node of v.nodes) {
        violations.push({
          ruleId: v.id,
          severity: SEVERITY_MAP[v.impact as string] || "moderate",
          wcagCriteria: v.tags.filter((t) => t.startsWith("wcag")),
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          htmlSnippet: node.html?.substring(0, 500) || "",
          cssSelector: node.target?.join(" > ") || "",
          fixSuggestion: getFixSuggestion(v.id, v.description),
        });
      }
    }
  } catch {
    violations.push({
      ruleId: "page-load-error",
      severity: "serious",
      wcagCriteria: [],
      description: `Failed to load or audit page: ${url}`,
      help: "Ensure the page is accessible and loads correctly.",
      helpUrl: "",
      htmlSnippet: "",
      cssSelector: "",
      fixSuggestion: "Check if the URL is valid and the page loads without errors.",
    });
  }

  const score = calculatePageScore(violations);

  return { url, violations, passes, incomplete, score };
}

function calculatePageScore(violations: AuditViolation[]): number {
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

export async function auditPages(
  urls: string[],
  onProgress?: (done: number, total: number, url: string) => void
): Promise<PageAuditResult[]> {
  const browser: Browser = await chromium.launch({ headless: true });
  const results: PageAuditResult[] = [];

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    for (let i = 0; i < urls.length; i++) {
      onProgress?.(i + 1, urls.length, urls[i]);
      const result = await auditPage(page, urls[i]);
      results.push(result);
    }

    await context.close();
  } finally {
    await browser.close();
  }

  return results;
}
