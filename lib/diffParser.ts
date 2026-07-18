import parseDiff from "parse-diff";
import type { ParsedHunk } from "./types";

function filenameFor(file: { to?: string; from?: string }) {
  return file.to && file.to !== "/dev/null" ? file.to : file.from ?? "unknown";
}

function splitFileDiffs(rawDiff: string) {
  const normalized = rawDiff.replace(/\r\n/g, "\n");
  const starts = [...normalized.matchAll(/^diff --git .+$/gm)].map((match) => match.index ?? 0);

  if (starts.length <= 1) {
    return [normalized];
  }

  return starts.map((start, index) => normalized.slice(start, starts[index + 1]).trimEnd());
}

export function parseUnifiedDiff(rawDiff: string): ParsedHunk[] {
  const files = splitFileDiffs(rawDiff).flatMap((section) => parseDiff(section));
  let sequence = 0;

  return files.flatMap((file) => {
    const filename = filenameFor(file);
    const isDeletedFile = Boolean(file.deleted || file.to === "/dev/null");

    return (file.chunks ?? []).map((chunk) => {
      sequence += 1;
      const addedLines: string[] = [];
      const removedLines: string[] = [];
      const displayLines = chunk.changes.map((change) => {
        if (change.type === "add") {
          const content = change.content.startsWith("+") ? change.content.slice(1) : change.content;
          addedLines.push(content);
          return { type: "add" as const, content, newLine: change.ln };
        }

        if (change.type === "del") {
          const content = change.content.startsWith("-") ? change.content.slice(1) : change.content;
          removedLines.push(content);
          return { type: "remove" as const, content, oldLine: change.ln };
        }

        const content = change.content.startsWith(" ") ? change.content.slice(1) : change.content;
        return {
          type: "context" as const,
          content,
          oldLine: change.ln1,
          newLine: change.ln2
        };
      });

      return {
        id: `hunk-${sequence}`,
        filename,
        startLine: chunk.newStart ?? chunk.oldStart ?? 1,
        header: chunk.content,
        content: chunk.changes.map((change) => change.content).join("\n"),
        addedLines,
        removedLines,
        displayLines,
        isDeletedFile
      };
    });
  });
}
