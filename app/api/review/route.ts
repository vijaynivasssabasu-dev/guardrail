import { NextResponse } from "next/server";
import { parseUnifiedDiff } from "@/lib/diffParser";
import { evaluateIntent } from "@/lib/intentCheck";
import { runOpenAIReview } from "@/lib/openaiReview";
import { isIgnoredPath, loadGuardrailConfig } from "@/lib/riskConfig";
import { mergeFindings } from "@/lib/reviewMerge";
import { scoreDiffHunks } from "@/lib/riskScoring";
import type { ReviewResult } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { diff?: string; intent?: string };
  const diff = body.diff?.trim();
  const intent = body.intent?.trim().slice(0, 500);

  if (!diff) {
    return NextResponse.json({ error: "Paste a unified diff before requesting review." }, { status: 400 });
  }

  const config = await loadGuardrailConfig();
  const parsedHunks = parseUnifiedDiff(diff).filter((hunk) => !isIgnoredPath(hunk.filename, config));

  if (parsedHunks.length === 0) {
    return NextResponse.json({ error: "No reviewable diff hunks found. Check the patch format or .guardrail.json ignoreDirectories." }, { status: 400 });
  }

  const scoredHunks = scoreDiffHunks(parsedHunks, config);
  const { findings, aiUnavailable } = await runOpenAIReview(scoredHunks);
  const hunks = mergeFindings(scoredHunks, findings);
  const flaggedHunks = hunks.filter((hunk) => hunk.finalRisk !== "LOW" || hunk.finding || hunk.needsTests).length;
  const result: ReviewResult = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    verdict: flaggedHunks === 0 ? "safe" : "needs_review",
    totalHunks: hunks.length,
    flaggedHunks,
    filenames: Array.from(new Set(hunks.map((hunk) => hunk.filename))),
    hunks,
    aiUnavailable,
    intentCheck: evaluateIntent(intent, hunks)
  };

  return NextResponse.json(result);
}
