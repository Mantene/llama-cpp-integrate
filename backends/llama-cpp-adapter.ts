import { LLMBackend, LLMBackendOptions, CompletionOptions, CompletionResult } from "./base-adapter.js";

const DEFAULT_URL = "http://localhost:8080";

/**
 * llama.cpp backend adapter
 * Uses the /completion endpoint
 */
export class LlamaCppAdapter implements LLMBackend {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(options: LLMBackendOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs || 30000;
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
      prompt: options.prompt,
      temperature: options.temperature ?? 0.7,
      n_predict: options.max_tokens ?? 128,
      stop: options.stop ?? ["\n\n"],
    };

    const resp = await this.fetchWithTimeout("/completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`llama.cpp error ${resp.status}: ${await resp.text()}`);
    }

    const result = await resp.json();
    return {
      content: result.content?.trim() || "",
      model: result.model || "llama-cpp",
      stop: result.stop || false,
      tokens_predicted: result.tokens_predicted,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const resp = await this.fetchWithTimeout("/health", { method: "GET" });
      return resp.ok;
    } catch {
      return false;
    }
  }

  getBackendName(): string {
    return "llama-cpp";
  }
}

/** Factory function for llama.cpp adapter */
export function createLlamaCppBackend(options?: LLMBackendOptions): LLMBackend {
  return new LlamaCppAdapter(options);
}