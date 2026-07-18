import type { ReviewFinding, RiskLevel, ScoredHunk } from "./types";
import { higherRisk } from "./riskScoring";

function severityRisk(severity: ReviewFinding["severity"]): RiskLevel {
  if (severity === "critical") {
    return "HIGH";
  }
  if (severity === "warning") {
    return "MEDIUM";
  }
  return "LOW";
}

export function mergeFindings(hunks: ScoredHunk[], findings: ReviewFinding[]): ScoredHunk[] {
  const byHunk = new Map(findings.map((finding) => [finding.hunkId, finding]));

  return hunks.map((hunk) => {
    const finding = byHunk.get(hunk.id);
    if (!finding) {
      return hunk;
    }

    return {
      ...hunk,
      finding,
      finalRisk: higherRisk(hunk.ruleRisk, severityRisk(finding.severity))
    };
  });
}
