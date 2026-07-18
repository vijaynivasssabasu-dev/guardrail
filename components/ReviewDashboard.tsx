"use client";

import { useEffect, useMemo, useState } from "react";
import { HunkCard } from "./HunkCard";
import { IntentCheckCard } from "./IntentCheckCard";
import { VerdictBanner } from "./VerdictBanner";
import { saveReview } from "@/lib/browserHistory";
import type { ReviewResult } from "@/lib/types";

type ReviewDashboardProps = {
  result: ReviewResult;
  sourceDiff: string;
  editorTheme?: "light" | "dark";
};

function isFlagged(hunk: ReviewResult["hunks"][number]) {
  return hunk.finalRisk !== "LOW" || Boolean(hunk.finding) || hunk.needsTests;
}

export function ReviewDashboard({ result, sourceDiff, editorTheme = "light" }: ReviewDashboardProps) {
  const flaggedIds = useMemo(() => result.hunks.filter(isFlagged).map((hunk) => hunk.id), [result.hunks]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [intentAcknowledged, setIntentAcknowledged] = useState(false);
  const [activeHunkId, setActiveHunkId] = useState(flaggedIds[0] ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const allAcknowledged = flaggedIds.every((id) => checked[id]);
  const intentNeedsAcknowledgement = result.intentCheck.status === "needs_attention";
  const canApprove = (result.verdict === "safe" || allAcknowledged) && (!intentNeedsAcknowledgement || intentAcknowledged);
  const reviewedCount = flaggedIds.filter((id) => checked[id]).length;
  const progress = flaggedIds.length === 0 ? 100 : Math.round((reviewedCount / flaggedIds.length) * 100);

  useEffect(() => {
    function acknowledgeFocusedHunk(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) {
        return;
      }

      if ((event.key === " " || event.key.toLowerCase() === "a") && flaggedIds.includes(activeHunkId)) {
        event.preventDefault();
        setChecked((current) => ({ ...current, [activeHunkId]: !current[activeHunkId] }));
      }
    }

    window.addEventListener("keydown", acknowledgeFocusedHunk);
    return () => window.removeEventListener("keydown", acknowledgeFocusedHunk);
  }, [activeHunkId, flaggedIds]);

  async function approve() {
    if (!canApprove) return;

    setStatus("saving");
    try {
      await saveReview({
        id: result.id,
        timestamp: new Date().toISOString(),
        verdict: result.verdict,
        totalHunks: result.totalHunks,
        flaggedHunks: result.flaggedHunks,
        filenames: result.filenames,
        diff: sourceDiff,
        result
      });
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      <VerdictBanner result={result} />
      <IntentCheckCard
        intentCheck={result.intentCheck}
        acknowledged={intentAcknowledged}
        onAcknowledgedChange={setIntentAcknowledged}
      />

      <div className="rounded border border-line bg-white px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-ink">{result.totalHunks} hunks across {result.filenames.length} files</p>
            <p className="text-sm text-slate-500">{result.filenames.join(", ")}</p>
          </div>
          <div className="flex items-center gap-4 sm:justify-end">
            <div
              className="grid h-20 w-20 place-items-center rounded-full p-1"
              style={{ background: `conic-gradient(#18202f ${progress}%, #e2e8f0 0)` }}
              aria-label={`${reviewedCount} of ${flaggedIds.length} flagged hunks acknowledged`}
            >
              <div className="grid h-full w-full place-items-center rounded-full bg-white text-center">
                <span className="text-lg font-bold text-ink">{reviewedCount}</span>
                <span className="-mt-1 text-[10px] font-semibold uppercase text-slate-500">of {flaggedIds.length}</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <button
                className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                disabled={!canApprove || status === "saving" || status === "saved"}
                onClick={approve}
              >
                {result.verdict === "safe" && !intentNeedsAcknowledgement ? "Auto-Approve" : "Approve & Merge"}
              </button>
              {result.verdict === "needs_review" && !allAcknowledged ? <p className="text-xs text-slate-500">Review every flagged hunk to unlock approval.</p> : null}
              {intentNeedsAcknowledgement && !intentAcknowledged ? <p className="text-xs text-slate-500">Acknowledge the intent check to unlock approval.</p> : null}
              {status === "saved" ? <p className="text-sm font-semibold text-emerald-700">Approved and added to history.</p> : null}
              {status === "error" ? <p className="text-sm font-semibold text-rose-700">Local history save failed. Try again.</p> : null}
            </div>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded bg-slate-100" aria-hidden="true">
          <div className="h-full bg-ink transition-[width] duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {result.hunks.map((hunk) => (
          <HunkCard
            key={hunk.id}
            hunk={hunk}
            flagged={isFlagged(hunk)}
            checked={Boolean(checked[hunk.id])}
            editorTheme={editorTheme}
            onFocus={() => setActiveHunkId(hunk.id)}
            onCheckedChange={(value) => setChecked((current) => ({ ...current, [hunk.id]: value }))}
          />
        ))}
      </div>
    </div>
  );
}
