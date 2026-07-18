import type { ScoredHunk } from "@/lib/types";

type DiffLineProps = {
  line: ScoredHunk["displayLines"][number];
};

export function DiffLine({ line }: DiffLineProps) {
  const prefix = line.type === "add" ? "+" : line.type === "remove" ? "-" : " ";
  const lineClass =
    line.type === "add"
      ? "bg-emerald-50 text-emerald-900"
      : line.type === "remove"
        ? "bg-rose-50 text-rose-900"
        : "bg-white text-slate-700";

  return (
    <div className={`grid grid-cols-[4.5rem_1rem_1fr] gap-3 px-3 py-1 ${lineClass}`}>
      <span className="select-none text-right text-xs text-slate-400">
        {line.oldLine ?? ""}
        {line.oldLine && line.newLine ? " / " : ""}
        {line.newLine ?? ""}
      </span>
      <span className="select-none text-slate-500">{prefix}</span>
      <code className="whitespace-pre-wrap break-words text-[13px] leading-5">{line.content}</code>
    </div>
  );
}
