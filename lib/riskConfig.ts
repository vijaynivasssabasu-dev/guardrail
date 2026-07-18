import { promises as fs } from "fs";
import path from "path";

export type GuardrailConfig = {
  highRiskWords?: string[];
  ignoreDirectories?: string[];
};

const configPath = path.join(process.cwd(), ".guardrail.json");

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : undefined;
}

export async function loadGuardrailConfig(): Promise<GuardrailConfig> {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      highRiskWords: stringArray(parsed.highRiskWords),
      ignoreDirectories: stringArray(parsed.ignoreDirectories)
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    console.warn("Guardrail could not read .guardrail.json; using default rules.", error);
    return {};
  }
}

export function isIgnoredPath(filename: string, config: GuardrailConfig) {
  return (config.ignoreDirectories ?? []).some((directory) => {
    const normalized = directory.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/$/, "");
    return normalized.length > 0 && filename.replace(/\\/g, "/").startsWith(`${normalized}/`);
  });
}
