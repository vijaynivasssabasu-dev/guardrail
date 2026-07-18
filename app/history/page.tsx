"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ReviewDashboard } from "@/components/ReviewDashboard";
import { listReviews } from "@/lib/browserHistory";
import type { HistoryRecord } from "@/lib/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listReviews().then(setHistory).catch(() => setError("Local history is unavailable in this browser."));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Local review log</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">History</h1>
        </div>
        <Link className="rounded bg-ink px-4 py-2 text-sm font-semibold text-white" href="/">
          Review another diff
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded border border-line bg-white shadow-soft">
        {error ? <div className="p-8 text-center text-rose-700">{error}</div> : null}
        {!error && history.length === 0 ? <div className="p-8 text-center text-slate-500">No approved reviews yet.</div> : null}
        {!error && history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Verdict</th>
                  <th className="px-4 py-3">Hunks</th>
                  <th className="px-4 py-3">Flagged</th>
                  <th className="px-4 py-3">Files</th>
                  <th className="px-4 py-3"><span className="sr-only">Re-audit</span></th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr className="border-t border-line" key={record.id}>
                    <td className="px-4 py-3 text-slate-700">{formatDate(record.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-1 text-xs font-bold ${record.verdict === "safe" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {record.verdict === "safe" ? "Auto-approved" : "Human reviewed"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{record.totalHunks}</td>
                    <td className="px-4 py-3 text-slate-700">{record.flaggedHunks}</td>
                    <td className="max-w-sm truncate px-4 py-3 text-slate-600">{record.filenames.join(", ")}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="inline-flex items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
                        type="button"
                        onClick={() => setSelected(record)}
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Re-audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {selected ? (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Re-auditing saved review</h2>
            <button className="text-sm font-semibold text-slate-600 hover:text-ink" type="button" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <ReviewDashboard result={selected.result} sourceDiff={selected.diff} />
        </section>
      ) : null}
    </main>
  );
}
