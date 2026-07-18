export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type FindingSeverity = "info" | "warning" | "critical";

export type ParsedHunk = {
  id: string;
  filename: string;
  startLine: number;
  header: string;
  content: string;
  addedLines: string[];
  removedLines: string[];
  displayLines: Array<{
    type: "add" | "remove" | "context";
    content: string;
    oldLine?: number;
    newLine?: number;
  }>;
  isDeletedFile: boolean;
};

export type ScoredHunk = ParsedHunk & {
  ruleRisk: RiskLevel;
  finalRisk: RiskLevel;
  reasons: string[];
  needsTests: boolean;
  finding?: ReviewFinding;
};

export type ReviewFinding = {
  hunkId: string;
  concern: string;
  severity: FindingSeverity;
};

export type IntentCheck = {
  status: "aligned" | "needs_attention" | "not_provided";
  intent: string;
  matchedTerms: string[];
  scopeDriftFiles: string[];
  summary: string;
};

export type ReviewResult = {
  id: string;
  createdAt: string;
  verdict: "safe" | "needs_review";
  totalHunks: number;
  flaggedHunks: number;
  filenames: string[];
  hunks: ScoredHunk[];
  aiUnavailable: boolean;
  intentCheck: IntentCheck;
};

export type HistoryRecord = {
  id: string;
  timestamp: string;
  verdict: "safe" | "needs_review";
  totalHunks: number;
  flaggedHunks: number;
  filenames: string[];
  diff: string;
  result: ReviewResult;
};
