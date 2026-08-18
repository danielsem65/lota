interface PageData {
  url: string;
  score: number;
  violationCount: number;
}

export default function PageBreakdown({ pages }: { pages: PageData[] }) {
  const sorted = [...pages].sort((a, b) => a.score - b.score);

  function scoreColor(score: number): string {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-lime-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 50) return "bg-orange-500";
    return "bg-red-500";
  }

  function scoreText(score: number): string {
    if (score >= 90) return "text-emerald-400";
    if (score >= 80) return "text-lime-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-orange-400";
    return "text-red-400";
  }

  return (
    <div className="space-y-2">
      {sorted.map((page) => (
        <div
          key={page.url}
          className="flex items-center gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3"
        >
          <div className="flex-1 truncate font-mono text-sm text-slate-300">
            {page.url}
          </div>
          <div className="text-xs text-slate-500">
            {page.violationCount} issue{page.violationCount !== 1 ? "s" : ""}
          </div>
          <div className="flex w-32 items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${scoreColor(page.score)}`}
                style={{ width: `${page.score}%` }}
              />
            </div>
            <span className={`w-8 text-right text-xs font-semibold ${scoreText(page.score)}`}>
              {page.score}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
