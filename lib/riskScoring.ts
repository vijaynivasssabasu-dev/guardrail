import ts from "typescript";
import { parser as pythonParser } from "@lezer/python";
import type { ParsedHunk, RiskLevel, ScoredHunk } from "./types";
import type { GuardrailConfig } from "./riskConfig";

const defaultHighRiskWords = ["password", "auth", "token", "secret", "api_key", "drop table", "delete from", "migration", ".env"];
const highRiskFilenamePattern = /(auth|payment|billing)/i;
const lowRiskFilenamePattern = /(test|spec|\.md$|\.txt$)/i;
const testFilenamePattern = /(test|spec)/i;
const assertionPattern = /\b(expect|assert|should|toEqual|toBe|toHaveBeen|describe|it|test)\b/i;
const logicSignalPattern = /([A-Za-z0-9_$)]\s*(=>|=|===|!==|==|!=|&&|\|\||\+|-|\*|\/)|\b(return|throw|await|if|for|while|switch|const|let|var|function)\b)/;
const validationPattern = /(validate|required|guard|throw new error|if \(|catch|try|invalid|expired|missing)/i;
const importPattern = /^\s*(import\s.+from\s+["'][^"']+["']|const\s+\w+\s*=\s*require\()/i;
const signaturePattern = /^\s*(export\s+)?(async\s+)?function\s+\w+\s*\(|^\s*(export\s+)?const\s+\w+\s*=\s*(async\s*)?\(/i;
const loggingPattern = /\b(console\.(log|debug|info|warn|error)|logger\.(debug|info|warn|error)|debugger)\b/i;
const queryPattern = /\.(where|delete|update|execute|query)\s*\(|\b(DELETE|UPDATE|INSERT|SELECT)\b/i;
const dependencyManifestPattern = /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
const configurationPattern = /(^|\/)(next\.config\.(mjs|js|ts)|tsconfig\.json|tailwind\.config\.(ts|js|mjs))$/i;
const dependencyDeclarationPattern = /"(dependencies|devDependencies|peerDependencies|optionalDependencies)"\s*:/;

function isCommentOrBlank(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.length === 0 ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("*/")
  );
}

function isLogicLine(line: string) {
  return !isCommentOrBlank(line) && !loggingPattern.test(line) && logicSignalPattern.test(line);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highRiskPattern(config: GuardrailConfig) {
  const words = config.highRiskWords?.length ? config.highRiskWords : defaultHighRiskWords;
  return new RegExp(words.map(escapeRegExp).join("|"), "i");
}

function isSourceFile(filename: string) {
  return /\.(ts|tsx|js|jsx|py)$/i.test(filename);
}

function hunkSource(hunk: ParsedHunk, revision: "old" | "new") {
  return hunk.displayLines
    .filter((line) => (revision === "old" ? line.type !== "add" : line.type !== "remove"))
    .map((line) => line.content)
    .join("\n");
}

function typeScriptNodeKinds(source: string, filename: string) {
  const scriptKind = /\.tsx$/i.test(filename) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, scriptKind);
  const kinds = new Set<string>();

  function visit(node: ts.Node) {
    if (
      ts.isIfStatement(node) ||
      ts.isTryStatement(node) ||
      ts.isCatchClause(node) ||
      ts.isConditionalExpression(node) ||
      ts.isForStatement(node) ||
      ts.isWhileStatement(node)
    ) {
      kinds.add(ts.SyntaxKind[node.kind]);
    }
    ts.forEachChild(node, visit);
  }

  visit(file);
  return kinds;
}

function pythonNodeKinds(source: string) {
  const kinds = new Set<string>();
  const cursor = pythonParser.parse(source).cursor();

  do {
    if (["IfStatement", "TryStatement", "ExceptClause", "ForStatement", "WhileStatement", "WithStatement"].includes(cursor.name)) {
      kinds.add(cursor.name);
    }
  } while (cursor.next());

  return kinds;
}

function structuralReasons(hunk: ParsedHunk) {
  if (!isSourceFile(hunk.filename)) {
    return [];
  }

  const removedText = hunk.removedLines.join("\n");
  const addedText = hunk.addedLines.join("\n");
  const reasons: string[] = [];

  if (/\.py$/i.test(hunk.filename)) {
    const oldKinds = pythonNodeKinds(hunkSource(hunk, "old"));
    const newKinds = pythonNodeKinds(hunkSource(hunk, "new"));
    if ([...oldKinds].some((kind) => !newKinds.has(kind))) {
      reasons.push("Removes a Python control-flow or exception-handling structure.");
    }
  } else {
    const oldKinds = typeScriptNodeKinds(hunkSource(hunk, "old"), hunk.filename);
    const newKinds = typeScriptNodeKinds(hunkSource(hunk, "new"), hunk.filename);
    const removedStructure = [...oldKinds].filter((kind) => !newKinds.has(kind));
    if (removedStructure.length > 0) {
      reasons.push("Removes a TypeScript or JavaScript control-flow structure.");
    }
  }

  if (queryPattern.test(removedText) || queryPattern.test(addedText)) {
    reasons.push("Changes a database query or data mutation call.");
  }

  return reasons;
}

function isLowRiskHunk(hunk: ParsedHunk) {
  const changedLines = [...hunk.addedLines, ...hunk.removedLines];
  if (changedLines.length === 0) {
    return true;
  }

  const commentOnly = changedLines.every(isCommentOrBlank);
  const lowRiskFile = lowRiskFilenamePattern.test(hunk.filename);
  const deletingAssertions = hunk.removedLines.some((line) => assertionPattern.test(line));

  return commentOnly || (lowRiskFile && !deletingAssertions);
}

function scoreHunk(
  hunk: ParsedHunk,
  diffTouchesTests: boolean,
  config: GuardrailConfig
): Omit<ScoredHunk, keyof ParsedHunk | "finalRisk"> {
  const reasons: string[] = [];
  const addedText = hunk.addedLines.join("\n");
  const removedText = hunk.removedLines.join("\n");
  const changedLines = [...hunk.addedLines, ...hunk.removedLines];
  const meaningfulLines = changedLines.filter((line) => !isCommentOrBlank(line) && !loggingPattern.test(line));
  const structuralChanges = structuralReasons(hunk);

  let ruleRisk: RiskLevel = "MEDIUM";

  if (hunk.isDeletedFile) {
    ruleRisk = "HIGH";
    reasons.push("Deletes a file.");
  }

  if (highRiskFilenamePattern.test(hunk.filename)) {
    ruleRisk = "HIGH";
    reasons.push("Touches auth, payment, or billing code.");
  }

  if (highRiskPattern(config).test(meaningfulLines.join("\n"))) {
    ruleRisk = "HIGH";
    reasons.push("Contains security, secret, migration, or destructive database keywords.");
  }

  if (dependencyManifestPattern.test(hunk.filename)) {
    if (dependencyDeclarationPattern.test(hunk.content) || /lock$/i.test(hunk.filename)) {
      ruleRisk = "HIGH";
      reasons.push("Adds or updates a package dependency or lockfile entry.");
    }
  }

  if (configurationPattern.test(hunk.filename) && ruleRisk !== "HIGH") {
    ruleRisk = "MEDIUM";
    reasons.push("Changes a build, compiler, or styling configuration file.");
  }

  if (hunk.addedLines.some((line) => importPattern.test(line))) {
    reasons.push("Introduces a new import or external dependency path.");
    if (ruleRisk !== "HIGH") {
      ruleRisk = "MEDIUM";
    }
  }

  if (hunk.removedLines.some((line) => validationPattern.test(line))) {
    ruleRisk = "HIGH";
    reasons.push("Removes validation or error-handling logic.");
  }

  if (structuralChanges.length > 0) {
    reasons.push(...structuralChanges);
    if (structuralChanges.some((reason) => reason.includes("Removes"))) {
      ruleRisk = "HIGH";
    }
  }

  if (changedLines.some((line) => signaturePattern.test(line))) {
    reasons.push("Changes a function signature that may affect callers.");
    if (ruleRisk !== "HIGH") {
      ruleRisk = "MEDIUM";
    }
  }

  if (isLowRiskHunk(hunk) && ruleRisk !== "HIGH") {
    ruleRisk = "LOW";
    reasons.push("Only changes comments, documentation, tests, or whitespace.");
  }

  const isTestFile = testFilenamePattern.test(hunk.filename);
  const changesLogic = !isTestFile && hunk.addedLines.some(isLogicLine);
  const needsTests = changesLogic && !diffTouchesTests;

  if (needsTests) {
    reasons.push("Changes non-test logic without a test or spec file in the same diff.");
  }

  if (reasons.length === 0) {
    reasons.push("Application logic changed, so it should receive a normal review.");
  }

  return {
    ruleRisk,
    reasons,
    needsTests
  };
}

export function scoreDiffHunks(hunks: ParsedHunk[], config: GuardrailConfig = {}): ScoredHunk[] {
  const diffTouchesTests = hunks.some((hunk) => testFilenamePattern.test(hunk.filename));

  return hunks.map((hunk) => {
    const score = scoreHunk(hunk, diffTouchesTests, config);
    return {
      ...hunk,
      ...score,
      finalRisk: score.ruleRisk
    };
  });
}

export function higherRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
  return order[a] >= order[b] ? a : b;
}
