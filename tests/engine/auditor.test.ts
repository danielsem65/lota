import { describe, it, expect } from "vitest";

describe("auditor", () => {
  it("audits HTML and returns violations", async () => {
    const { auditHtml } = await import("@/engine/auditor");

    const html = `<!DOCTYPE html>
<html>
<head><title>Test Page</title></head>
<body>
  <img src="photo.jpg">
  <div style="color: #fff; background: #fff">Low contrast text</div>
  <a href="/link"></a>
</body>
</html>`;

    const result = await auditHtml("https://example.com", html);

    expect(result.url).toBe("https://example.com");
    expect(result.violations).toBeDefined();
    expect(Array.isArray(result.violations)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns high score for accessible HTML", async () => {
    const { auditHtml } = await import("@/engine/auditor");

    const html = `<!DOCTYPE html>
<html lang="en">
<head><title>Accessible Page</title></head>
<body>
  <main>
    <h1>Hello World</h1>
    <img src="photo.jpg" alt="A photo">
    <a href="/link">Click here</a>
    <label for="name">Name</label>
    <input type="text" id="name">
  </main>
</body>
</html>`;

    const result = await auditHtml("https://example.com", html);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("handles invalid HTML gracefully", async () => {
    const { auditHtml } = await import("@/engine/auditor");
    const result = await auditHtml("https://example.com", "not html");
    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
