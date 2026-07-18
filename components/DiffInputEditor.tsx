"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((module) => module.default), {
  ssr: false,
  loading: () => <div className="h-[28rem] animate-pulse rounded border border-line bg-slate-100" />
});

type DiffInputEditorProps = {
  value: string;
  onChange: (value: string) => void;
  editorTheme: "light" | "dark";
};

export function DiffInputEditor({ value, onChange, editorTheme }: DiffInputEditorProps) {
  return (
    <div className="mt-2 overflow-hidden rounded border border-line">
      <MonacoEditor
        height="28rem"
        language="diff"
        theme={editorTheme === "dark" ? "vs-dark" : "vs"}
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={{
          automaticLayout: true,
          fontSize: 13,
          lineHeight: 20,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          ariaLabel: "Unified diff editor"
        }}
      />
    </div>
  );
}
