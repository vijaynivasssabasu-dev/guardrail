"use client";

import { useState, type FormEvent } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { HunkDiffEditor } from "./HunkDiffEditor";
import type { ScoredHunk } from "@/lib/types";

type HunkCardProps = {
  hunk: ScoredHunk;
  flagged: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onFocus: () => void;
  editorTheme: "light" | "dark";
};

const riskStyles = {
  LOW: "border-l-emerald-500 bg-emerald-50/40",
  MEDIUM: "border-l-amber-500 bg-amber-50/50",
  HIGH: "border-l-rose-600 bg-rose-50/50"
};

const riskPill = {
  LOW: "bg-emerald-100 text-emerald-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-rose-100 text-rose-800"
};

const severityLabel = {
  info: "Info",
  warning: "Warning",
  critical: "Critical"
};

function reasonCategory(reason: string) {
  if (/security|secret|auth|validation/i.test(reason)) return "Security";
  if (/database|query|mutation/i.test(reason)) return "Database";
  if (/dependency|import/i.test(reason)) return "Dependency";
  if (/configuration|compiler|styling/i.test(reason)) return "Configuration";
  if (/test/i.test(reason)) return "Tests";
  if (/structure|signature/i.test(reason)) return "Structure";
  return "Review";
}

const categoryStyle: Record<string, string> = {
  Security: "bg-rose-100 text-rose-800",
  Database: "bg-orange-100 text-orange-800",
  Dependency: "bg-violet-100 text-violet-800",
  Configuration: "bg-blue-100 text-blue-800",
  Tests: "bg-amber-100 text-amber-800",
  Structure: "bg-cyan-100 text-cyan-800",
  Review: "bg-slate-100 text-slate-700"
};

export function HunkCard({ hunk, flagged, checked, onCheckedChange, onFocus, editorTheme }: HunkCardProps) {
  const [open, setOpen] = useState(Boolean(hunk.finding));
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [questionError, setQuestionError] = useState("");

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    setAsking(true);
    setQuestionError("");
    const response = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hunk, question: trimmedQuestion })
    });
    const payload = (await response.json()) as { answer?: string; error?: string };
    setAsking(false);

    if (!response.ok) {
      setQuestionError(payload.error ?? "Guardrail could not answer that question.");
      return;
    }

    setAnswer(payload.answer ?? "No answer was returned.");
  }

  return (
    <article className={`rounded border border-line border-l-4 bg-white shadow-soft transition-all duration-300 hover:shadow-md animate-slide-up ${riskStyles[hunk.finalRisk]}`} tabIndex={0} onFocus={onFocus}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold text-ink">{hunk.filename}</h3>
            <span className={`rounded px-2 py-1 text-xs font-bold ${riskPill[hunk.finalRisk]}`}>
              {hunk.finalRisk}
            </span>
            {hunk.needsTests ? (
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                Needs tests
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Line {hunk.startLine} · {hunk.header}
          </p>
        </div>
        {flagged ? (
          <label className="flex shrink-0 items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700">
            <input
              className="h-4 w-4 accent-ink"
              type="checkbox"
              checked={checked}
              onChange={(event) => onCheckedChange(event.target.checked)}
            />
            I&apos;ve reviewed this
          </label>
        ) : null}
      </div>

      <div className="overflow-hidden border-y border-line bg-white">
        <HunkDiffEditor hunk={hunk} editorTheme={editorTheme} />
      </div>

      <div className="p-4">
        <button
          className="text-sm font-semibold text-slate-700 hover:text-ink"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Hide review details" : "Show review details"}
        </button>
        {open ? (
          <div className="mt-3 border-t border-line pt-3 space-y-4">
            {hunk.finding ? (
              <div className="rounded bg-white px-3 py-3 text-sm text-slate-700 border border-line">
                <p className="font-semibold text-ink">{severityLabel[hunk.finding.severity]}</p>
                <p className="mt-1 text-slate-600">{hunk.finding.concern}</p>
              </div>
            ) : null}
            <ul className="space-y-1 text-sm text-slate-600 bg-slate-50/50 p-3 rounded border border-line/60">
              <p className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">Automated Heuristics</p>
              {hunk.reasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <form className="mt-4 border-t border-line pt-4" onSubmit={askQuestion}>
          <label className="text-sm font-semibold text-ink" htmlFor={`question-${hunk.id}`}>
            Ask AI about this change
          </label>
          <div className="mt-2 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <MessageCircleQuestion className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                id={`question-${hunk.id}`}
                className="w-full rounded border border-line py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-ink"
                placeholder="Why is this risky?"
                value={question}
                maxLength={600}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </div>
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded bg-ink text-white disabled:cursor-wait disabled:bg-slate-400"
              type="submit"
              disabled={asking || !question.trim()}
              title="Ask AI"
              aria-label="Ask AI"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {questionError ? <p className="mt-2 text-sm font-semibold text-rose-700">{questionError}</p> : null}
          {answer ? <p className="mt-3 text-sm leading-6 text-slate-700">{answer}</p> : null}
        </form>
      </div>
    </article>
  );
}
