"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ScoreGauge from "@/components/ScoreGauge";
import ViolationList from "@/components/ViolationList";
import PageBreakdown from "@/components/PageBreakdown";
import ExportButton from "@/components/ExportButton";

interface ScanData {
  id: string;
  url: string;
  score: number;
  totalViolations: number;
  bySeverity: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  pages: {
    url: string;
    score: number;
    violationCount: number;
    passes: number;
    incomplete: number;
    violations: {
      ruleId: string;
      severity: string;
      wcagCriteria: string[];
      description: string;
      help: string;
      helpUrl: string;
      htmlSnippet: string;
      cssSelector: string;
      fixSuggestion: string;
    }[];
  }[];
  pagesFound: number;
  pagesAudited: number;
}

export default function AuditDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ScanData | null>(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/audit/" + id);
        const json = await res.json();
        if (json.status === "done") {
          setData(json);
          setStatus("done");
          clearInterval(interval);
        } else if (json.status === "error") {
          setStatus("error");
          clearInterval(interval);
        } else {
          setStatus(json.status);
        }
      } catch {
        setStatus("error");
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (status === "error") {
    return (
      <div className="py-20 text-center">
        <div className="mb-4 text-4xl text-red-400">!</div>
        <h1 className="mb-2 text-xl font-bold">Scan Failed</h1>
        <p className="text-slate-500">Something went wrong. Try again.</p>
        <a href="/" className="mt-6 inline-block text-emerald-400 underline">
          Go back
        </a>
      </div>
    );
  }

  if (status !== "done" || !data) {
    const msgs: Record<string, string> = {
      loading: "Loading results...",
      pending: "Queued...",
      crawling: "Crawling website pages...",
      auditing: "Running accessibility audit on each page...",
      scoring: "Calculating scores...",
    };
    return (
      <div className="py-20 text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
        <h1 className="mb-2 text-xl font-bold">
          {msgs[status] || "Processing..."}
        </h1>
        <p className="text-sm text-slate-500">
          This may take a few minutes for large sites.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <a
            href="/"
            className="mb-2 inline-block text-sm text-slate-500 hover:text-slate-300"
          >
            &larr; New scan
          </a>
          <h1 className="text-2xl font-bold">{data.url}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.pagesAudited} pages audited &middot; {data.totalViolations}{" "}
            violations found
          </p>
        </div>
        <ExportButton scanId={id} />
      </div>

      <div className="mb-10 flex items-center gap-10">
        <ScoreGauge score={data.score} />
        <div className="grid grid-cols-4 gap-4">
          <Stat
            label="Critical"
            count={data.bySeverity.critical}
            color="text-red-400"
          />
          <Stat
            label="Serious"
            count={data.bySeverity.serious}
            color="text-orange-400"
          />
          <Stat
            label="Moderate"
            count={data.bySeverity.moderate}
            color="text-yellow-400"
          />
          <Stat
            label="Minor"
            count={data.bySeverity.minor}
            color="text-blue-400"
          />
        </div>
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Violations</h2>
        <ViolationList pages={data.pages} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Page Breakdown</h2>
        <PageBreakdown pages={data.pages} />
      </div>
    </div>
  );
}

function Stat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{count}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}
