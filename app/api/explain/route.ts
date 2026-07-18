import { NextResponse } from "next/server";
import { explainHunk } from "@/lib/openaiReview";
import type { ScoredHunk } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { hunk?: ScoredHunk; question?: string };
  const question = body.question?.trim();

  if (!body.hunk || !question) {
    return NextResponse.json({ error: "A hunk and question are required." }, { status: 400 });
  }

  if (question.length > 600) {
    return NextResponse.json({ error: "Keep the question under 600 characters." }, { status: 400 });
  }

  const response = await explainHunk(body.hunk, question);
  return NextResponse.json(response);
}
