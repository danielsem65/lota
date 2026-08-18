"use client";

interface ViolationCardProps {
  violation: {
    ruleId: string;
    severity: string;
    wcagCriteria: string[];
    description: string;
    help: string;
    helpUrl: string;
    htmlSnippet: string;
    cssSelector: string;
    fixSuggestion: string;
    pageUrl?: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  serious: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  moderate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  minor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function ViolationCard({
  violation,
  isExpanded,
  onToggle,
}: ViolationCardProps) {
  const v = violation;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 transition hover:border-slate-700">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${SEVERITY_COLORS[v.severity] || ""}`}
        >
          {v.severity}
        </span>
        <span className="flex-1 font-mono text-sm text-slate-200">
          {v.ruleId}
        </span>
        {v.wcagCriteria.length > 0 && (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-500">
            {v.wcagCriteria[0]}
          </span>
        )}
        <svg
          className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3">
          <p className="mb-3 text-sm text-slate-300">{v.description}</p>
          <p className="mb-3 text-sm text-slate-400">{v.help}</p>

          {v.pageUrl && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-slate-500">Page</div>
              <a
                href={v.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:underline"
              >
                {v.pageUrl}
              </a>
            </div>
          )}

          {v.htmlSnippet && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-slate-500">Element</div>
              <pre className="overflow-x-auto rounded bg-slate-800/50 p-3 text-xs text-slate-300">
                <code>{v.htmlSnippet}</code>
              </pre>
            </div>
          )}

          {v.cssSelector && (
            <div className="mb-3">
              <div className="mb-1 text-xs font-medium text-slate-500">Selector</div>
              <code className="text-xs text-slate-400">{v.cssSelector}</code>
            </div>
          )}

          <div className="rounded-lg border border-emerald-800/50 bg-emerald-900/20 p-3">
            <div className="mb-1 text-xs font-medium text-emerald-400">
              How to fix
            </div>
            <p className="text-sm text-slate-300">{v.fixSuggestion}</p>
          </div>

          {v.helpUrl && (
            <a
              href={v.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-blue-400 hover:underline"
            >
              Learn more about {v.ruleId} &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}
