import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getBackend } from "./backends/index.js";
import type { CompletionOptions, LLMBackendOptions } from "./backends/base-adapter.js";

const backend = getBackend();

// ── agent-optimizations loader ─────────────────────────────────────

const OPTIM_DIR = join(dirname(fileURLToPath(import.meta.url)), "agent-optimizations");

function loadOptimTemplate(name: string): string {
  return readFileSync(join(OPTIM_DIR, name), "utf-8");
}

// ── types ───────────────────────────────────────────────────────────

export interface AgentHelperOptions {
  contextInjection: boolean;
  promptOptimization: boolean;
  tokenOptimization: boolean;
  silentErrors: boolean;
}

const DEFAULT_OPTIONS: AgentHelperOptions = {
  contextInjection: true,
  promptOptimization: true,
  tokenOptimization: true,
  silentErrors: true,
};

export type WorkflowType =
  | "code-generation"
  | "skill-creation"
  | "mcp-development"
  | "debugging"
  | "explanation";

const WORKFLOW_TEMPLATE_MAP: Record<WorkflowType, string | null> = {
  "code-generation": "code-quality-improvement.txt",
  "skill-creation": "skill-development-workflow.txt",
  "mcp-development": "mcp-integration-assistant.txt",
  debugging: "reasoning-enhancement.txt",
  explanation: "reasoning-enhancement.txt",
};

// ── class ───────────────────────────────────────────────────────────

export class LlamaAgentHelpers {
  private opts: AgentHelperOptions;

  constructor(opts?: Partial<AgentHelperOptions>) {
    this.opts = { ...DEFAULT_OPTIONS, ...opts };
  }

  injectContext(prompt: string, context: Record<string, unknown>): string {
    if (!this.opts.contextInjection || Object.keys(context).length === 0) return prompt;
    return `Context:\n${JSON.stringify(context, null, 2)}\n\nTask:\n${prompt}`;
  }

  optimizePrompt(prompt: string, workflow: WorkflowType): string {
    if (!this.opts.promptOptimization) return prompt;
    const tplFile = WORKFLOW_TEMPLATE_MAP[workflow];
    if (!tplFile) return prompt;
    try {
      const prefix = loadOptimTemplate(tplFile).trim();
      return `${prefix}\n\n${prompt}`;
    } catch {
      return prompt;
    }
  }

  optimizeTokens(prompt: string): string {
    if (!this.opts.tokenOptimization) return prompt;
    return prompt.replace(/[ \t]+/g, " ").trim();
  }

  async run(
    workflow: WorkflowType,
    prompt: string,
    context: Record<string, unknown> = {},
    extra?: Partial<CompletionOptions>
  ): Promise<string | null> {
    try {
      let p = this.injectContext(prompt, context);
      p = this.optimizePrompt(p, workflow);
      p = this.optimizeTokens(p);
      const res = await backend.complete({ prompt: p, ...extra });
      return res.content.trim();
    } catch (err) {
      if (this.opts.silentErrors) {
        console.error("[llama-agent-helpers] silent fail:", err);
        return null;
      }
      throw err;
    }
  }

  async isAvailable(): Promise<boolean> {
    return backend.healthCheck();
  }
}