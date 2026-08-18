import { describe, it, expect } from "vitest";

describe("reporter", () => {
  it("generates valid JSON report", async () => {
    const { generateJsonReport } = await import("@/engine/reporter");
    const { buildScanResult } = await import("@/engine/scorer");

    const scanResult = buildScanResult("test-scan", "https://example.com", [
      {
        url: "https://example.com",
        violations: [
          {
            ruleId: "color-contrast",
            severity: "serious",
            wcagCriteria: ["wcag2aa"],
            description: "Low contrast",
            help: "Increase contrast",
            helpUrl: "https://example.com",
            htmlSnippet: "<div>text</div>",
            cssSelector: "div",
            fixSuggestion: "Use darker colors",
          },
        ],
        passes: 10,
        incomplete: 1,
        score: 95,
      },
    ]);

    const report = generateJsonReport(scanResult) as Record<string, unknown>;

    expect(report).toHaveProperty("meta");
    expect(report).toHaveProperty("summary");
    expect(report).toHaveProperty("pages");

    const meta = report.meta as Record<string, unknown>;
    expect(meta.url).toBe("https://example.com");
    expect(meta.scanId).toBe("test-scan");
    expect(meta.score).toBe(95);

    const summary = report.summary as Record<string, unknown>;
    expect(summary.grade).toBe("A");
  });

  it("generates valid HTML report", async () => {
    const { generateHtmlReport } = await import("@/engine/reporter");
    const { buildScanResult } = await import("@/engine/scorer");

    const scanResult = buildScanResult("test-scan", "https://example.com", []);
    const html = generateHtmlReport(scanResult);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Lota Accessibility Report");
    expect(html).toContain("https://example.com");
    expect(html).toContain("Grade A");
  });

  it("assigns correct grades", async () => {
    const { generateJsonReport } = await import("@/engine/reporter");
    const { buildScanResult } = await import("@/engine/scorer");

    const testCases = [
      { score: 95, expectedGrade: "A" },
      { score: 85, expectedGrade: "B" },
      { score: 75, expectedGrade: "C" },
      { score: 55, expectedGrade: "D" },
      { score: 30, expectedGrade: "F" },
    ];

    for (const tc of testCases) {
      const scanResult = buildScanResult("test", "https://example.com", [
        {
          url: "https://example.com",
          violations: [],
          passes: 10,
          incomplete: 0,
          score: tc.score,
        },
      ]);
      scanResult.score = tc.score;

      const report = generateJsonReport(scanResult) as Record<string, unknown>;
      const summary = report.summary as Record<string, unknown>;
      expect(summary.grade).toBe(tc.expectedGrade);
    }
  });
});
