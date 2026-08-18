"use client";

import { useState } from "react";
import ViolationCard from "./ViolationCard";

interface PageViolation {
  ruleId: string;
  severity: string;
  wcagCriteria: string[];
  description: string;
  help: string;
  helpUrl: string;
  htmlSnippet: string;
  cssSelector: string;
  fixSuggestion: string;
}

interface PageData {
  url: string;
  score: number;
  violationCount: number;
  violations: PageViolation[];
}

export default function ViolationList({ pages }: { pages: PageData[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const allViolations = pages.flatMap((p) =>
    p.violations.map((v) => ({ ...v, pageUrl: p.url }))
  );

  const filtered =
    filter === "all"
      ? allViolations
      : allViolations.filter((v) => v.severity === filter);

  const counts = {
    all: allViolations.length,
    critical: allViolations.filter((v) => v.severity === "critical").length,
    serious: allViolations.filter((v) => v.severity === "serious").length,
    moderate: allViolations.filter((v) => v.severity === "moderate").length,
    minor: allViolations.filter((v) => v.severity === "minor").length,
  };

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (allViolations.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-900/20 p-8 text-center">
        <div className="mb-2 text-3xl text-emerald-400">No violations found!</div>
        <p className="text-sm text-slate-400">
          This site passed all automated WCAG 2.2 AA checks.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(["all", "critical", "serious", "moderate", "minor"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === s
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          )
        )}
      </div>

      <div className="space-y-2">
        {filtered.map((v, i) => {
          const key = `${v.ruleId}-${v.pageUrl}-${i}`;
          return (
            <ViolationCard
              key={key}
              violation={v}
              isExpanded={expanded.has(key)}
              onToggle={() => toggleExpand(key)}
            />
          );
        })}
      </div>
    </div>
  );
}
