import { LLMBackend, LLMBackendOptions, CompletionOptions, CompletionResult } from "./base-adapter.js";

const DEFAULT_URL = "http://localhost:11434";

/**
 * Ollama backend adapter
 * Uses the /api/generate endpoint
 */
export class OllamaAdapter implements LLMBackend {
  private baseUrl: string;
  private timeoutMs: number;
  private defaultModel: string;

  constructor(options: LLMBackendOptions = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs || 30000;
    this.defaultModel = options.defaultModel || "llama2";
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
      options: {
        num_predict: options.max_tokens ?? 128,
        stop: options.stop,
      },
      stream: false,
    };

    const resp = await this.fetchWithTimeout("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error(`Ollama error ${resp.status}: ${await resp.text()}`);
    }

    const result = await resp.json();
    return {
      content: result.response?.trim() || "",
      model: result.model || this.defaultModel,
      stop: result.done || false,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Ollama has a /api/tags endpoint for listing models - we can use that
      const resp = await this.fetchWithTimeout("/api/tags", { method: "GET" });
      return resp.ok;
    } catch {
      return false;
    }
  }

  getBackendName(): string {
    return "ollama";
  }
}

/** Factory function for Ollama adapter */
export function createOllamaBackend(options?: LLMBackendOptions): LLMBackend {
  return new OllamaAdapter(options);
}