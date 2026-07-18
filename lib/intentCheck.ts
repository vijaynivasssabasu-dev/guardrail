import type { IntentCheck, ScoredHunk } from "./types";

const ignoredTerms = new Set([
  "about",
  "after",
  "again",
  "also",
  "before",
  "change",
  "code",
  "from",
  "into",
  "must",
  "should",
  "that",
  "the",
  "then",
  "this",
  "when",
  "with",
  "will"
]);

function extractTerms(value: string) {
  return Array.from(
    new Set(
      (value.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? []).filter((term) => !ignoredTerms.has(term))
    )
  ).slice(0, 10);
}

export function evaluateIntent(intent: string | undefined, hunks: ScoredHunk[]): IntentCheck {
  const normalizedIntent = intent?.trim() ?? "";
  if (!normalizedIntent) {
    return {
      status: "not_provided",
      intent: "",
      matchedTerms: [],
      scopeDriftFiles: [],
      summary: "No expected behavior was recorded for this review."
    };
  }

  const intentTerms = extractTerms(normalizedIntent);
  if (intentTerms.length === 0) {
    return {
      status: "needs_attention",
      intent: normalizedIntent,
      matchedTerms: [],
      scopeDriftFiles: Array.from(new Set(hunks.map((hunk) => hunk.filename))),
      summary: "The stated intent did not contain enough specific terms to map against this diff."
    };
  }

  const matchedTerms = intentTerms.filter((term) =>
    hunks.some((hunk) => `${hunk.filename}\n${hunk.header}\n${hunk.addedLines.join("\n")}`.toLowerCase().includes(term))
  );
  const scopeDriftFiles = Array.from(
    new Set(
      hunks
        .filter((hunk) => {
          const changeText = `${hunk.filename}\n${hunk.header}\n${hunk.addedLines.join("\n")}`.toLowerCase();
          return !matchedTerms.some((term) => changeText.includes(term));
        })
        .map((hunk) => hunk.filename)
    )
  );

  if (matchedTerms.length > 0 && scopeDriftFiles.length === 0) {
    return {
      status: "aligned",
      intent: normalizedIntent,
      matchedTerms,
      scopeDriftFiles,
      summary: "The changed code has direct term overlap with the stated intent, with no separate file scope to review."
    };
  }

  const matchSummary = matchedTerms.length > 0 ? `Matched: ${matchedTerms.join(", ")}.` : "No direct intent terms matched the changed code.";
  const driftSummary = scopeDriftFiles.length > 0 ? ` Review the scope in ${scopeDriftFiles.join(", ")}.` : "";

  return {
    status: "needs_attention",
    intent: normalizedIntent,
    matchedTerms,
    scopeDriftFiles,
    summary: `${matchSummary}${driftSummary}`
  };
}
