"use client";

export default function ExportButton({ scanId }: { scanId: string }) {
  function download(format: "json" | "html") {
    const url = `/api/audit/${scanId}${format === "html" ? "?format=html" : ""}`;
    window.open(url, "_blank");
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => download("json")}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
      >
        JSON
      </button>
      <button
        onClick={() => download("html")}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
      >
        HTML Report
      </button>
    </div>
  );
}
