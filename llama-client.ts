export interface LlamaCompletionOptions {
  prompt: string;
  temperature?: number;
  top_p?: number;
  n_predict?: number;
  stop?: string[];
  repeat_penalty?: number;
  repeat_last_n?: number;
  seed?: number;
  tfs_z?: number;
  typical_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  mirostat?: number;
  mirostat_tau?: number;
  mirostat_eta?: number;
  grammar?: string;
  n_gpu_layers?: number;
  n_ctx?: number;
  n_batch?: number;
}

export interface LlamaCompletionResult {
  content: string;
  tokens: number[];
  tokens_predicted: number;
  tokens_evaluated: number;
  model: string;
  stop: boolean;
  timings?: {
    prompt_ms: number;
    predicted_ms: number;
  };
}

export interface LlamaClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  defaultOptions?: LlamaCompletionOptions;
}

export class LlamaClient {
  private baseUrl: string;
  private timeoutMs: number;
  private defaultOptions: LlamaCompletionOptions;

  constructor(config: LlamaClientConfig) {
    this.baseUrl = config.baseUrl.endsWith("/")
      ? config.baseUrl.slice(0, -1)
      : config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.defaultOptions = {
      temperature: 0.7,
      top_p: 0.95,
      n_predict: 128,
      stop: ["\n\n"],
      repeat_penalty: 1.1,
      repeat_last_n: 64,
      ...config.defaultOptions,
    };
  }

  private async fetchWithTimeout(
    resource: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(`${this.baseUrl}${resource}`, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(id);
    }
  }

  async complete(
    options: LlamaCompletionOptions = {} as LlamaCompletionOptions
  ): Promise<LlamaCompletionResult> {
    const merged = { ...this.defaultOptions, ...options };
    const response = await this.fetchWithTimeout("/completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: merged.prompt,
        temperature: merged.temperature,
        top_p: merged.top_p,
        n_predict: merged.n_predict,
        stop: merged.stop,
        repeat_penalty: merged.repeat_penalty,
        repeat_last_n: merged.repeat_last_n,
        seed: merged.seed,
        tfs_z: merged.tfs_z,
        typical_p: merged.typical_p,
        presence_penalty: merged.presence_penalty,
        frequency_penalty: merged.frequency_penalty,
        mirostat: merged.mirostat,
        mirostat_tau: merged.mirostat_tau,
        mirostat_eta: merged.mirostat_eta,
        grammar: merged.grammar,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Llama server error ${response.status}: ${errorText}`);
    }
    return (await response.json()) as LlamaCompletionResult;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout("/health", {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export function createLlamaClient(
  baseUrl: string = "http://localhost:8080",
  options?: Partial<LlamaClientConfig>
): LlamaClient {
  return new LlamaClient({
    baseUrl,
    timeoutMs: options?.timeoutMs,
    defaultOptions: options?.defaultOptions,
  });
}

/** Default singleton client pointing at localhost:8080 */
export const defaultLlamaClient = createLlamaClient();
