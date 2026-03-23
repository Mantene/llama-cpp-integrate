/**
 * Base interface for all LLM backend adapters.
 * Each backend (llama.cpp, Ollama, LM Studio) implements this interface.
 */
export interface LLMBackendOptions {
  baseUrl?: string;
  timeoutMs?: number;
  defaultModel?: string;
}

export interface CompletionOptions {
  prompt: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  model?: string;
}

export interface CompletionResult {
  content: string;
  model: string;
  stop: boolean;
  tokens_predicted?: number;
}

export interface LLMBackend {
  /** Send a completion request to the backend */
  complete(options: CompletionOptions): Promise<CompletionResult>;
  
  /** Check if the backend is available and responsive */
  healthCheck(): Promise<boolean>;
  
  /** Get the backend name for logging */
  getBackendName(): string;
}

/** Factory function type for creating backends */
export type BackendFactory = (options?: LLMBackendOptions) => LLMBackend;