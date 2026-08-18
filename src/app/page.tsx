"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let targetUrl = url.trim();
    if (!targetUrl) {
      setError("Please enter a URL");
      return;
    }
    if (!targetUrl.startsWith("http")) {
      targetUrl = "https://" + targetUrl;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed");
        setLoading(false);
        return;
      }

      router.push(`/audit/${data.scanId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-6 text-6xl font-bold text-emerald-400">lota</div>
      <p className="mb-2 text-xl text-slate-300">
        Accessibility clarity in one scan
      </p>
      <p className="mb-10 max-w-md text-center text-sm text-slate-500">
        Enter any website URL. Lota crawls it, audits every page against WCAG
        2.2, and gives you a scored report with developer-friendly fix
        suggestions.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-xl">
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Scanning...
              </span>
            ) : (
              "Audit"
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        )}
      </form>

      {loading && (
        <div className="mt-10 text-center text-slate-500">
          <p className="text-sm">
            Crawling and auditing. This may take a few minutes...
          </p>
        </div>
      )}

      <div className="mt-20 grid max-w-3xl grid-cols-3 gap-8 text-center">
        <div>
          <div className="mb-2 text-2xl font-bold text-emerald-400">WCAG 2.2</div>
          <div className="text-xs text-slate-500">Full AA compliance check</div>
        </div>
        <div>
          <div className="mb-2 text-2xl font-bold text-emerald-400">50 pages</div>
          <div className="text-xs text-slate-500">Deep crawl coverage</div>
        </div>
        <div>
          <div className="mb-2 text-2xl font-bold text-emerald-400">Fix code</div>
          <div className="text-xs text-slate-500">Developer-ready suggestions</div>
        </div>
      </div>
    </div>
  );
}
