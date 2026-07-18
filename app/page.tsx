"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileUp, LoaderCircle, Moon, Play, Sun, Target, Upload } from "lucide-react";
import { DiffInputEditor } from "@/components/DiffInputEditor";
import { ReviewDashboard } from "@/components/ReviewDashboard";
import { WelcomeGreeting } from "@/components/WelcomeGreeting";
import type { ReviewResult } from "@/lib/types";

function AnalysisState() {
  return (
    <div className="grid min-h-[34rem] place-items-center rounded border border-line bg-white p-8">
      <div className="w-full max-w-md space-y-5">
        <div className="flex items-center gap-3 text-ink">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="font-semibold">Analyzing code changes</span>
        </div>
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded bg-slate-100" />
          <div className="h-32 animate-pulse rounded bg-slate-100 [animation-delay:150ms]" />
          <div className="h-20 animate-pulse rounded bg-slate-100 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [diff, setDiff] = useState("");
  const [intent, setIntent] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"light" | "dark">("light");
  const fileInput = useRef<HTMLInputElement>(null);

  async function loadPatchFile(file: File) {
    if (!/\.(diff|patch)$/i.test(file.name)) {
      setError("Choose a .diff or .patch file.");
      return;
    }

    const text = await file.text();
    if (!text.trim()) {
      setError("That patch file is empty.");
      return;
    }

    setDiff(text);
    setResult(null);
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) void loadPatchFile(file);
  }

  async function reviewDiff() {
    setLoading(true);
    setError("");
    setResult(null);
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diff, intent })
    });
    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Review failed.");
      return;
    }

    setResult(payload as ReviewResult);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(22rem,0.85fr)_minmax(0,1.15fr)] lg:px-8">
      <section className="space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">AI code review triage</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink sm:text-4xl">Find the risky 20% of an AI diff.</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Paste or drop a patch to surface the changes that deserve human attention before approval.</p>
        </div>
        <WelcomeGreeting />

        <div className="rounded border border-line bg-white p-4 shadow-soft">
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Target className="h-4 w-4" aria-hidden="true" />
              Expected behavior
              <span className="font-normal text-slate-500">Optional</span>
            </span>
            <textarea
              className="mt-2 min-h-20 w-full resize-y rounded border border-line bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-slate-500"
              value={intent}
              maxLength={500}
              placeholder="Reject expired password-reset tokens without changing normal sign-in."
              onChange={(event) => {
                setIntent(event.target.value);
                setResult(null);
              }}
            />
          </label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-ink">Unified diff</span>
            <div className="flex items-center gap-1" aria-label="Editor theme">
              <button
                className={`grid h-8 w-8 place-items-center rounded ${editorTheme === "light" ? "bg-slate-100 text-ink" : "text-slate-500 hover:bg-slate-100"}`}
                type="button"
                title="Use light editor theme"
                aria-label="Use light editor theme"
                aria-pressed={editorTheme === "light"}
                onClick={() => setEditorTheme("light")}
              >
                <Sun className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                className={`grid h-8 w-8 place-items-center rounded ${editorTheme === "dark" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                type="button"
                title="Use dark editor theme"
                aria-label="Use dark editor theme"
                aria-pressed={editorTheme === "dark"}
                onClick={() => setEditorTheme("dark")}
              >
                <Moon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div
            className={`mt-3 rounded border border-dashed p-2 transition-colors ${isDragging ? "border-ink bg-slate-100" : "border-line"}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <DiffInputEditor value={diff} onChange={setDiff} editorTheme={editorTheme} />
          </div>
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".diff,.patch,text/x-diff,text/plain"
            onChange={(event) => {
              const file = event.target.files?.item(0);
              if (file) void loadPatchFile(file);
              event.target.value = "";
            }}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button className="inline-flex items-center justify-center gap-2 rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50" type="button" onClick={() => fileInput.current?.click()}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              Choose patch
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded bg-ink px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-slate-400" type="button" disabled={loading || !diff.trim()} onClick={reviewDiff}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {loading ? "Reviewing..." : "Review This Diff"}
            </button>
          </div>
          {isDragging ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600"><FileUp className="h-4 w-4" aria-hidden="true" />Drop the patch to load it.</p> : null}
          {error ? <p className="mt-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </div>
      </section>

      <section className="min-w-0">
        {loading ? <AnalysisState /> : null}
        {!loading && result ? <ReviewDashboard result={result} sourceDiff={diff} editorTheme={editorTheme} /> : null}
        {!loading && !result ? (
          <div className="grid min-h-[34rem] place-items-center rounded border border-dashed border-line bg-white/70 p-8 text-center">
            <div>
              <h2 className="text-xl font-bold text-ink">Review dashboard appears here</h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">Paste a diff or choose a patch file to inspect its review state.</p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
