# Llama-CPP Integration Skill

Integrate local LLM backends (llama.cpp, Ollama, LM Studio) to provide AI-assisted development within OpenClaw.

## Features

**Multi-backend support** - Switch between different LLM providers:
- **llama.cpp** - Local llama-server (default)
- **Ollama** - Local Ollama instance
- **LM Studio** - Local LM Studio API

User-facing tools (explicit invocation):
- `llama_complete`: Generate code completions from prompts
- `llama_skill`: Create skill scaffolding from natural language descriptions
- `llama_mcp`: Generate MCP server templates
- `llama_explain`: Explain existing code snippets
- `llama_refactor`: Suggest refactoring improvements

Agent-optimized usage (internal):
- Automatic context injection from current task/session
- Smart prompt engineering according to workflow type
- Silent error handling to avoid disrupting the user experience
- Token optimization for cost-effective reasoning
- Background processing capabilities

## Installation

```bash
# Clone the skill
git clone https://github.com/Mantene/llama-cpp-integrate.git ~/.openclaw/skills/llama-cpp-integrate
```

Or publish via ClawHub.

## Configuration

### Selecting a Backend

Edit `backends/config.json` to choose your LLM backend:

```json
{
  "backend": "llama-cpp",
  "baseUrl": "http://localhost:8080",
  "timeoutMs": 30000,
  "defaultModel": "deepseek-coder-v2-lite-instruct-q4_k_m"
}
```

**Available backends:**

| Backend | Default URL | Notes |
|---------|-------------|-------|
| `llama-cpp` | localhost:8080 | Uses llama-server /completion endpoint |
| `ollama` | localhost:11434 | Uses /api/generate endpoint |
| `lm-studio` | localhost:1234 | Uses OpenAI-compatible /v1/completions |

### Backend-Specific Settings

**Ollama:**
```json
{
  "backend": "ollama",
  "baseUrl": "http://localhost:11434",
  "defaultModel": "llama2"
}
```

**LM Studio:**
```json
{
  "backend": "lm-studio",
  "baseUrl": "http://localhost:1234",
  "defaultModel": "local-model"
}
```

## Usage

### Explicit invocation

Users can call the tools directly:
```
/llama complete "Write a function to calculate factorial"
/llama skill "Create a skill for managing API keys"
/llama explain "const add = (a, b) => a + b;"
/llama mcp "Create an MCP server for file operations"
/llama refactor "function calc(a,b){if(a>0){return a*b}else{return a+b}}"
```

### Internal agent use

The OpenClaw agent automatically uses the optimized flow when relevant tasks arise. The `LlamaAgentHelpers.run(workflow, prompt, context)` function orchestrates context injection, prompt optimization, and model completion.

## Code Structure

```
llama-cpp-integrate/
├── backends/
│   ├── base-adapter.ts       # Common interface for all backends
│   ├── llama-cpp-adapter.ts  # llama.cpp implementation
│   ├── ollama-adapter.ts     # Ollama implementation
│   ├── lm-studio-adapter.ts  # LM Studio implementation
│   ├── index.ts              # Factory - selects backend from config
│   └── config.json           # Backend configuration
├── llama-tools.ts            # User-facing tools
├── llama-agent-helpers.ts    # Agent-side helpers
├── prompt-templates/         # Reusable prompt templates
├── agent-optimizations/      # Workflow-specific optimizations
├── SKILL.md                  # Skill definition
└── README.md                 # This file
```

## Adding New Backends

To add support for a new LLM backend:

1. Create `backends/newbackend-adapter.ts` implementing `LLMBackend` interface
2. Add factory function to `backends/index.ts`
3. Update `backends/config.json` with new backend name

The interface is minimal:
```typescript
interface LLMBackend {
  complete(options: CompletionOptions): Promise<CompletionResult>;
  healthCheck(): Promise<boolean>;
  getBackendName(): string;
}
```

## Development

This skill follows Test-Driven Development practices. Run tests against a live backend to verify functionality.

## Requirements

- Node.js 18+ with fetch support
- At least one LLM backend running (llama.cpp, Ollama, or LM Studio)
- Compatible model loaded in your backend

## License

MIT