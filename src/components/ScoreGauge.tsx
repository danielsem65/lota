export default function ScoreGauge({ score }: { score: number }) {
  const grade =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 50 ? "D" : "F";

  const color =
    score >= 90
      ? "#22c55e"
      : score >= 80
        ? "#84cc16"
        : score >= 70
          ? "#eab308"
          : score >= 50
            ? "#f97316"
            : "#ef4444";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          fill={color}
          fontSize="28"
          fontWeight="700"
        >
          {score}
        </text>
        <text
          x="60"
          y="74"
          textAnchor="middle"
          fill={color}
          fontSize="14"
          fontWeight="600"
        >
          {grade}
        </text>
      </svg>
      <div className="mt-1 text-xs text-slate-500">Score</div>
    </div>
  );
}
