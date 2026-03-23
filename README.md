# Llama-CPP Integration Skill

Integrate a locally running llama.cpp server to provide AI-assisted development within OpenClaw.

## Features

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

Copy the skill directory to `~/.openclaw/skills/llama-cpp-integrate/` or publish via ClawHub.

## Configuration

Default llama-server URL: `http://localhost:8080`

You can adjust the server URL by setting the `LLAMA_SERVER_URL` environment variable or by changing the default in `llama-client.ts`.

## Usage

### Explicit invocation

Users can call the tools directly, e.g.:
```
/llama complete "Write a function to calculate factorial"
/llama skill "Create a skill for managing API keys"
/llama explain "const add = (a, b) => a + b;"
```

### Internal agent use

The OpenClaw agent automatically uses the optimized flow when relevant tasks arise. The `LlamaAgentHelpers.run(workflow, prompt, context)` function orchestrates context injection, prompt optimization, and model completion.

## Code structure

- `llama-client.ts`: HTTP client wrapper for the llama-server completion API
- `llama-tools.ts`: User-facing tools; they load prompts from `prompt-templates/`
- `llama-agent-helpers.ts`: Agent-side helpers; they pull optimizations from `agent-optimizations/`
- `prompt-templates/*.txt`: Reusable prompt templates with Mustache-style placeholders
- `agent-optimizations/*.txt`: Workflow-specific system prefixes and guidance

## Development

This skill follows Test-Driven Development practices. Unit tests mock the HTTP client. Integration tests can run against a live llama-server.

## Requirements

- Running llama-server with DeepSeek-Coder-V2-Lite-Instruct-Q4_K_M-GGUF model
- Node.js with fetch available (Node 18+)
