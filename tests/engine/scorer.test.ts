import { describe, it, expect } from "vitest";
import { calculateScore, countBySeverity, buildScanResult } from "@/engine/scorer";
import { AuditViolation, PageAuditResult } from "@/engine/types";

function makeViolation(overrides: Partial<AuditViolation> = {}): AuditViolation {
  return {
    ruleId: "color-contrast",
    severity: "serious",
    wcagCriteria: ["wcag2aa", "wcag143"],
    description: "Insufficient color contrast",
    help: "Elements must have sufficient color contrast",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.10/color-contrast",
    htmlSnippet: '<div style="color: #fff">text</div>',
    cssSelector: "#main > div",
    fixSuggestion: "Increase contrast ratio to 4.5:1",
    ...overrides,
  };
}

describe("calculateScore", () => {
  it("returns 100 for no violations", () => {
    expect(calculateScore([])).toBe(100);
  });

  it("deducts 10 per critical", () => {
    const violations = [
      makeViolation({ severity: "critical" }),
      makeViolation({ severity: "critical" }),
    ];
    expect(calculateScore(violations)).toBe(80);
  });

  it("deducts 5 per serious", () => {
    const violations = [makeViolation({ severity: "serious" })];
    expect(calculateScore(violations)).toBe(95);
  });

  it("deducts 2 per moderate", () => {
    const violations = [makeViolation({ severity: "moderate" })];
    expect(calculateScore(violations)).toBe(98);
  });

  it("deducts 1 per minor", () => {
    const violations = [makeViolation({ severity: "minor" })];
    expect(calculateScore(violations)).toBe(99);
  });

  it("never goes below 0", () => {
    const violations = Array(20).fill(makeViolation({ severity: "critical" }));
    expect(calculateScore(violations)).toBe(0);
  });

  it("handles mixed severities", () => {
    const violations = [
      makeViolation({ severity: "critical" }),   // -10
      makeViolation({ severity: "serious" }),     // -5
      makeViolation({ severity: "moderate" }),    // -2
      makeViolation({ severity: "minor" }),       // -1
    ];
    expect(calculateScore(violations)).toBe(82);
  });
});

describe("countBySeverity", () => {
  it("counts zero for empty", () => {
    expect(countBySeverity([])).toEqual({
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    });
  });

  it("counts correctly", () => {
    const violations = [
      makeViolation({ severity: "critical" }),
      makeViolation({ severity: "critical" }),
      makeViolation({ severity: "serious" }),
      makeViolation({ severity: "minor" }),
    ];
    expect(countBySeverity(violations)).toEqual({
      critical: 2,
      serious: 1,
      moderate: 0,
      minor: 1,
    });
  });
});

describe("buildScanResult", () => {
  it("builds correct result from page results", () => {
    const pageResults: PageAuditResult[] = [
      {
        url: "https://example.com",
        violations: [
          makeViolation({ severity: "serious" }),
          makeViolation({ severity: "minor" }),
        ],
        passes: 10,
        incomplete: 2,
        score: 94,
      },
      {
        url: "https://example.com/about",
        violations: [makeViolation({ severity: "critical" })],
        passes: 15,
        incomplete: 0,
        score: 90,
      },
    ];

    const result = buildScanResult("scan-1", "https://example.com", pageResults);

    expect(result.id).toBe("scan-1");
    expect(result.url).toBe("https://example.com");
    expect(result.pagesFound).toBe(2);
    expect(result.pagesAudited).toBe(2);
    expect(result.totalViolations).toBe(3);
    expect(result.bySeverity).toEqual({
      critical: 1,
      serious: 1,
      moderate: 0,
      minor: 1,
    });
    expect(result.score).toBe(92); // average of 94 and 90
  });

  it("returns 100 for no pages", () => {
    const result = buildScanResult("scan-2", "https://example.com", []);
    expect(result.score).toBe(100);
    expect(result.totalViolations).toBe(0);
  });
});
