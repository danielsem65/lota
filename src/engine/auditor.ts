import { JSDOM } from "jsdom";
import axe from "axe-core";
import { AuditViolation, PageAuditResult } from "./types";

const SEVERITY_MAP: Record<string, AuditViolation["severity"]> = {
  critical: "critical",
  serious: "serious",
  moderate: "moderate",
  minor: "minor",
};

const FIX_SUGGESTIONS: Record<string, string> = {
  "color-contrast":
    "Increase the contrast ratio between foreground and background colors. WCAG AA requires 4.5:1 for normal text and 3:1 for large text.",
  "image-alt":
    "Add descriptive alt text to the image: <img alt='Description of image' ...>. For decorative images use alt=''.",
  label:
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
    "Ensure heading levels increase by one (h1 to h2 to h3). Do not skip heading levels.",
  "region":
    "Ensure all page content is contained within landmark regions (header, nav, main, footer).",
  "aria-allowed-attr":
    "Check that ARIA attributes are valid for the element's role.",
  "tabindex":
    "Avoid positive tabindex values. Use tabindex='0' for focusable elements.",
  "duplicate-id":
    "Ensure all id attributes are unique within the page.",
  "valid-lang":
    "Ensure the lang attribute value is a valid ISO 639 language code.",
  "frame-title":
    "Add a descriptive title attribute to iframe elements.",
  "target-size":
    "Ensure touch targets are at least 24x24 CSS pixels (WCAG 2.2 SC 2.5.8).",
};

function getFixSuggestion(ruleId: string, description: string): string {
  if (FIX_SUGGESTIONS[ruleId]) return FIX_SUGGESTIONS[ruleId];
  return `Fix: ${description}. See WCAG guidelines for detailed remediation steps.`;
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

export async function auditHtml(
  url: string,
  html: string
): Promise<PageAuditResult> {
  const violations: AuditViolation[] = [];
  let passes = 0;
  let incomplete = 0;

  try {
    const dom = new JSDOM(html, {
      url,
      pretendToBeVisual: true,
      resources: "usable",
    });

    const document = dom.window.document;

    const results = await new Promise<axe.AxeResults>((resolve, reject) => {
      axe.run(
        document,
        {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
          },
        },
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    passes = results.passes.length;
    incomplete = results.incomplete.length;

    for (const v of results.violations) {
      for (const node of v.nodes) {
        violations.push({
          ruleId: v.id,
          severity: SEVERITY_MAP[v.impact as string] || "moderate",
          wcagCriteria: v.tags.filter((t: string) => t.startsWith("wcag")),
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          htmlSnippet: node.html?.substring(0, 500) || "",
          cssSelector: node.target?.join(" > ") || "",
          fixSuggestion: getFixSuggestion(v.id, v.description),
        });
      }
    }

    dom.window.close();
  } catch {
    violations.push({
      ruleId: "audit-error",
      severity: "serious",
      wcagCriteria: [],
      description: `Failed to audit page: ${url}`,
      help: "Ensure the page HTML is valid and loads correctly.",
      helpUrl: "",
      htmlSnippet: "",
      cssSelector: "",
      fixSuggestion:
        "Check if the URL is valid and returns valid HTML content.",
    });
  }

  return {
    url,
    violations,
    passes,
    incomplete,
    score: calculatePageScore(violations),
  };
}
