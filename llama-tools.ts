import { getBackend } from "./backends/index.js";
import type { CompletionOptions } from "./backends/base-adapter.js";

const backend = getBackend();

export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

// ── helper ─────────────────────────────────────────────────────────

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v).replaceAll(`{${k}}`, v);
  }
  return out;
}

// ── prompt templates (inline for now) ─────────────────────────────

const TEMPLATES = {
  skill: `Create a complete OpenClaw skill for:\nDescription: {{description}}\nSkill Name: {{name}}\n\nProvide SKILL.md, implementation files, and usage examples.`,
  mcp: `Generate an MCP server template for:\nDescription: {{description}}\nServer Name: {{name}}\n\nProvide TypeScript implementation with proper MCP spec compliance.`,
  explain: `Explain this code:\n{{code}}\n\nDetail: {{detailLevel}}`,
  refactor: `Refactor for {{goals}}:\n{{code}}\n\nProvide refactored code and explanation.`,
};

// ── llama_complete ──────────────────────────────────────────────────
export async function llama_complete(opts: {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}): Promise<ToolResult> {
  try {
    const result = await backend.complete({
      prompt: opts.prompt,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 128,
      stop: opts.stop,
    });
    return { success: true, result: result.content };
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
    const name = opts.name || opts.description.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const prompt = fillTemplate(TEMPLATES.skill, { description: opts.description, name });
    const result = await backend.complete({ prompt, temperature: 0.3, max_tokens: 1024 });
    return { success: true, result: result.content };
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
    const name = opts.serverName || opts.description.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const prompt = fillTemplate(TEMPLATES.mcp, { description: opts.description, name });
    const result = await backend.complete({ prompt, temperature: 0.4, max_tokens: 1500 });
    return { success: true, result: result.content };
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
    const prompt = fillTemplate(TEMPLATES.explain, {
      code: `\`\`\`${opts.language || "auto"}\n${opts.code}\n\`\`\``,
      detailLevel: opts.detailLevel || "moderate",
    });
    const result = await backend.complete({ prompt, temperature: 0.2, max_tokens: 512 });
    return { success: true, result: result.content };
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
    const goals = (opts.goals || ["readability", "maintainability"]).join(", ");
    const prompt = fillTemplate(TEMPLATES.refactor, { code: opts.code, goals });
    const result = await backend.complete({ prompt, temperature: 0.3, max_tokens: 1024 });
    return { success: true, result: result.content };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}