"use client";

import dynamic from "next/dynamic";
import type { ScoredHunk } from "@/lib/types";

const MonacoDiffEditor = dynamic(() => import("@monaco-editor/react").then((module) => module.DiffEditor), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse bg-slate-100" />
});

function languageFor(filename: string) {
  if (/\.tsx?$/i.test(filename)) return "typescript";
  if (/\.jsx?$/i.test(filename)) return "javascript";
  if (/\.py$/i.test(filename)) return "python";
  if (/\.json$/i.test(filename)) return "json";
  if (/\.css$/i.test(filename)) return "css";
  if (/\.html?$/i.test(filename)) return "html";
  if (/\.md$/i.test(filename)) return "markdown";
  return "plaintext";
}

type HunkDiffEditorProps = {
  hunk: ScoredHunk;
  editorTheme: "light" | "dark";
};

export function HunkDiffEditor({ hunk, editorTheme }: HunkDiffEditorProps) {
  const original = hunk.displayLines
    .filter((line) => line.type !== "add")
    .map((line) => line.content)
    .join("\n");
  const modified = hunk.displayLines
    .filter((line) => line.type !== "remove")
    .map((line) => line.content)
    .join("\n");
  const height = Math.min(Math.max(hunk.displayLines.length * 20 + 38, 176), 460);

  return (
    <div className="h-full" style={{ height }}>
      <MonacoDiffEditor
        original={original}
        modified={modified}
        language={languageFor(hunk.filename)}
        theme={editorTheme === "dark" ? "vs-dark" : "vs"}
        options={{
          automaticLayout: true,
          readOnly: true,
          renderSideBySide: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          wordWrap: "on",
          fontSize: 13,
          lineHeight: 20,
          hideUnchangedRegions: { enabled: false },
          renderOverviewRuler: false,
          originalEditable: false,
          ariaLabel: `Read-only diff for ${hunk.filename}`
        }}
      />
    </div>
  );
}
