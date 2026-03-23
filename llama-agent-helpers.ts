import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { LlamaClient, LlamaCompletionOptions } from "./llama-client";

// ── template loader ─────────────────────────────────────────────────

const OPTIM_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "agent-optimizations"
);

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

/**
 * Map workflow types to the on-disk optimization template file.
 * Falls back to a generic prefix when no template matches.
 */
const WORKFLOW_TEMPLATE_MAP: Record<WorkflowType, string | null> = {
  "code-generation": "code-quality-improvement.txt",
  "skill-creation": "skill-development-workflow.txt",
  "mcp-development": "mcp-integration-assistant.txt",
  debugging: "reasoning-enhancement.txt",
  explanation: "reasoning-enhancement.txt",
};

// ── class ───────────────────────────────────────────────────────────

export class LlamaAgentHelpers {
  private client: LlamaClient;
  private opts: AgentHelperOptions;

  constructor(client: LlamaClient, opts?: Partial<AgentHelperOptions>) {
    this.client = client;
    this.opts = { ...DEFAULT_OPTIONS, ...opts };
  }

  // ── context injection ───────────────────────────────────────────

  injectContext(prompt: string, context: Record<string, unknown>): string {
    if (!this.opts.contextInjection || Object.keys(context).length === 0) {
      return prompt;
    }
    return `Context:\n${JSON.stringify(context, null, 2)}\n\nTask:\n${prompt}`;
  }

  // ── prompt optimization (loads agent-optimizations/ template) ───

  optimizePrompt(prompt: string, workflow: WorkflowType): string {
    if (!this.opts.promptOptimization) return prompt;

    const tplFile = WORKFLOW_TEMPLATE_MAP[workflow];
    if (!tplFile) return prompt;

    try {
      const prefix = loadOptimTemplate(tplFile).trim();
      return `${prefix}\n\n${prompt}`;
    } catch {
      // template missing — fall through without prefix
      return prompt;
    }
  }

  // ── token optimization ──────────────────────────────────────────

  optimizeTokens(prompt: string): string {
    if (!this.opts.tokenOptimization) return prompt;
    return prompt.replace(/[ \t]+/g, " ").trim();
  }

  // ── high-level run ──────────────────────────────────────────────

  /**
   * Context-inject → optimise prompt → compress tokens → call model.
   * Returns the trimmed completion text, or null on silent failure.
   */
  async run(
    workflow: WorkflowType,
    prompt: string,
    context: Record<string, unknown> = {},
    extra?: Partial<LlamaCompletionOptions>
  ): Promise<string | null> {
    try {
      let p = this.injectContext(prompt, context);
      p = this.optimizePrompt(p, workflow);
      p = this.optimizeTokens(p);
      const res = await this.client.complete({ prompt: p, ...extra });
      return res.content.trim();
    } catch (err) {
      if (this.opts.silentErrors) {
        console.error("[llama-agent-helpers] silent fail:", err);
        return null;
      }
      throw err;
    }
  }

  // ── health probe (useful for heartbeat checks) ──────────────────

  async isAvailable(): Promise<boolean> {
    return this.client.healthCheck();
  }
}
