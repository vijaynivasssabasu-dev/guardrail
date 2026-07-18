import type { ReviewResult } from "@/lib/types";

type VerdictBannerProps = {
  result: ReviewResult;
};

export function VerdictBanner({ result }: VerdictBannerProps) {
  const safe = result.verdict === "safe";

  return (
    <section
      className={`rounded border px-5 py-4 ${
        safe ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">{safe ? "Safe to auto-approve" : "Needs human review"}</h2>
          <p className="text-sm">
            {safe
              ? "Every hunk is low risk and no reviewer findings were returned."
              : `${result.flaggedHunks} of ${result.totalHunks} hunks need explicit acknowledgement before approval.`}
          </p>
        </div>
        {result.aiUnavailable ? (
          <span className="rounded bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700">
            AI fallback active
          </span>
        ) : null}
      </div>
    </section>
  );
}
