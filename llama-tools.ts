import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createLlamaClient, LlamaCompletionOptions } from "./llama-client";

const llamaClient = createLlamaClient();

// ── helpers ─────────────────────────────────────────────────────────

const TEMPLATES_DIR = join(dirname(fileURLToPath(import.meta.url)), "prompt-templates");

function loadTemplate(name: string): string {
  return readFileSync(join(TEMPLATES_DIR, name), "utf-8");
}

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v).replaceAll(`{${k}}`, v);
  }
  return out;
}

export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

// ── llama_complete ──────────────────────────────────────────────────
export async function llama_complete(opts: {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}): Promise<ToolResult> {
  try {
    const tpl = loadTemplate("code-completion.txt");
    const prompt = fillTemplate(tpl, {
      language: "auto",
      code: opts.prompt,
    });
    const payload: LlamaCompletionOptions = {
      prompt,
      temperature: opts.temperature ?? 0.7,
      n_predict: opts.max_tokens ?? 128,
      stop: opts.stop ?? ["\n\n"],
    };
    const res = await llamaClient.complete(payload);
    return { success: true, result: res.content.trim() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── llama_skill ─────────────────────────────────────────────────────
export async function llama_skill(opts: {
  description: string;
  name?: string;
}): Promise<ToolResult> {
  try {
    const skillName =
      opts.name ||
      opts.description
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const tpl = loadTemplate("skill-generation.txt");
    const prompt = fillTemplate(tpl, {
      description: opts.description,
      skillName,
    });

    const res = await llamaClient.complete({
      prompt,
      temperature: 0.3,
      n_predict: 1024,
      stop: ["\n\n\n"],
    });
    return { success: true, result: res.content.trim() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── llama_mcp ───────────────────────────────────────────────────────
export async function llama_mcp(opts: {
  description: string;
  serverName?: string;
}): Promise<ToolResult> {
  try {
    const serverName =
      opts.serverName ||
      opts.description
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const tpl = loadTemplate("mcp-template.txt");
    const prompt = fillTemplate(tpl, {
      description: opts.description,
      serverName,
    });

    const res = await llamaClient.complete({
      prompt,
      temperature: 0.4,
      n_predict: 1500,
      stop: ["\n\n\n"],
    });
    return { success: true, result: res.content.trim() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── llama_explain ───────────────────────────────────────────────────
export async function llama_explain(opts: {
  code: string;
  language?: string;
  detailLevel?: "brief" | "moderate" | "detailed";
}): Promise<ToolResult> {
  try {
    const lang = opts.language ?? "auto-detected";
    const tpl = loadTemplate("code-explanation.txt");
    const prompt = fillTemplate(tpl, {
      language: lang,
      code: opts.code,
      detailLevel: opts.detailLevel ?? "moderate",
    });

    const res = await llamaClient.complete({
      prompt,
      temperature: 0.2,
      n_predict: 512,
      stop: ["\n\n\n"],
    });
    return { success: true, result: res.content.trim() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── llama_refactor ──────────────────────────────────────────────────
export async function llama_refactor(opts: {
  code: string;
  language?: string;
  goals?: string[];
}): Promise<ToolResult> {
  try {
    const lang = opts.language ?? "auto-detected";
    const goals = (opts.goals ?? ["readability", "maintainability"]).join(", ");
    const tpl = loadTemplate("refactoring-suggestions.txt");
    const prompt = fillTemplate(tpl, {
      language: lang,
      code: opts.code,
      goals,
    });

    const res = await llamaClient.complete({
      prompt,
      temperature: 0.3,
      n_predict: 1024,
      stop: ["\n\n\n"],
    });
    return { success: true, result: res.content.trim() };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
