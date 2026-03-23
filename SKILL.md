# Local LLM Integration Skill

Integrates with locally running llama.cpp server to provide AI-assisted code generation, skill creation, and MCP development capabilities.

## Description
This skill connects to your local llama-server (default: http://localhost:8080)  to provide:
- Code completion and generation
- Skill scaffolding from natural language
- MCP server template generation
- Code explanation and refactoring suggestions
- Agent-optimized internal usage for seamless AI assistance

## Features

### Dual‑use design
- **Explicit user invocation**: Tools can be called directly via `/llama …` commands for immediate AI assistance.
- **Internal agent use**: The OpenClaw agent automatically leverages the skill during task execution (context‑injected, token‑optimized, silent‑error) to avoid disrupting the user experience.

### Agent‑specific optimizations
- Automatic context injection from the current session/task
- Smart prompt engineering based on workflow type (code‑generation, skill‑creation, mcp‑development, debugging, explanation)
- Token usage optimization for cost‑effective agent reasoning
- Background processing capabilities for non‑blocking operations
- Silent error handling: failures are logged internally without surfacing to the user

## Tools
- `llama_complete`: Generate code completions from prompts
- `llama_skill`: Create skill scaffolding from natural language descriptions
- `llama_mcp`: Generate MCP server templates
- `llama_explain`: Explain existing code snippets
- `llama_refactor`: Suggest refactoring improvements

## Usage
Tools can be invoked explicitly or used internally by the OpenClaw agent for enhanced workflow assistance.

## Configuration
The skill uses the following default configuration:
- Server URL: http://localhost:8080
- Timeout: 30 seconds
- Default completion options: temperature=0.7, n_predict=128, stop=["\n\n"], repeat_penalty=1.1, repeat_last_n=64

The HTTP client can be customized when creating a LlamaClient instance:
```typescript
const client = createLlamaClient('http://localhost:8080', {
  timeoutMs: 30000,
  defaultOptions: {
    temperature: 0.7,
    n_predict: 128
  }
});
```

## Internal Agent Optimizations
When used internally by the agent, the skill provides:
- Automatic context injection from current task/session
- Smart prompt engineering based on workflow type
- Token usage optimization for cost-effective reasoning
- Background processing capabilities for non‑blocking operations
- Silent error handling to avoid disrupting user experience

## Development
This skill was developed with:
- TypeScript for type safety and better developer experience
- Modular design for easy extension and maintenance
- Comprehensive error handling with fallback mechanisms
- Agent-specific optimizations for seamless internal use