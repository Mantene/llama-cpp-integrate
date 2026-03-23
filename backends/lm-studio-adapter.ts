import { LLMBackend, LLMBackendOptions, CompletionOptions, CompletionResult } from "./base-adapter.js";

const DEFAULT_URL = "http://localhost:1234";

/**
 * LM Studio backend adapter
 * Uses the OpenAI-compatible /v1/completions endpoint
 */
export class LMStudioAdapter implements LLMBackend {
  private baseUrl: string;
  private timeoutMs: number;
  private defaultModel: string;

  constructor(options: LLMBackendOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs || 30000;
    this.defaultModel = options.defaultModel || "local-model";
  }

  private async fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal });
      return resp;
    } finally {
      clearTimeout(id);
    }
  }

  async complete(options: CompletionOptions): Promise<CompletionResult> {
    const payload = {
      model: options.model || this.defaultModel,
      prompt: options.prompt,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 128,
      stop: options.stop || undefined,
    };

    const resp = await this.fetchWithTimeout("/v1/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`LM Studio error ${resp.status}: ${await resp.text()}`);
    }

    const result = await resp.json();
    const choice = result.choices?.[0];
    return {
      content: choice?.text?.trim() || choice?.message?.content?.trim() || "",
      model: result.model || this.defaultModel,
      stop: choice?.finish_reason === "stop",
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // LM Studio has a /v1/models endpoint
      const resp = await this.fetchWithTimeout("/v1/models", { method: "GET" });
      return resp.ok;
    } catch {
      return false;
    }
  }

  getBackendName(): string {
    return "lm-studio";
  }
}

/** Factory function for LM Studio adapter */
export function createLMStudioBackend(options?: LLMBackendOptions): LLMBackend {
  return new LMStudioAdapter(options);
}