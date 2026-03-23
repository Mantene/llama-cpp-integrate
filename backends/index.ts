import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { LLMBackend, LLMBackendOptions, BackendFactory } from "./base-adapter.js";
import { createLlamaCppBackend } from "./llama-cpp-adapter.js";
import { createOllamaBackend } from "./ollama-adapter.js";
import { createLMStudioBackend } from "./lm-studio-adapter.js";

/** Available backend factories */
const BACKENDS: Record<string, BackendFactory> = {
  "llama-cpp": createLlamaCppBackend,
  "ollama": createOllamaBackend,
  "lm-studio": createLMStudioBackend,
};

/** Configuration file type */
export interface BackendConfig {
  backend: "llama-cpp" | "ollama" | "lm-studio";
  baseUrl?: string;
  timeoutMs?: number;
  defaultModel?: string;
}

/**
 * Load configuration from file or use defaults
 */
function loadConfig(): BackendConfig {
  try {
    const configPath = join(dirname(fileURLToPath(import.meta.url)), "config.json");
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch {
    // Default to llama-cpp if no config
    return { backend: "llama-cpp" };
  }
}

/**
 * Get the currently configured backend
 */
export function getBackend(): LLMBackend {
  const config = loadConfig();
  const factory = BACKENDS[config.backend];
  
  if (!factory) {
    throw new Error(`Unknown backend: ${config.backend}. Available: ${Object.keys(BACKENDS).join(", ")}`);
  }
  
  return factory({
    baseUrl: config.baseUrl,
    timeoutMs: config.timeoutMs,
    defaultModel: config.defaultModel,
  });
}

/**
 * List available backends
 */
export function listBackends(): string[] {
  return Object.keys(BACKENDS);
}

/**
 * Check if a specific backend is available
 */
export async function isBackendAvailable(backend: string): Promise<boolean> {
  const factory = BACKENDS[backend];
  if (!factory) return false;
  
  try {
    const instance = factory();
    return await instance.healthCheck();
  } catch {
    return false;
  }
}