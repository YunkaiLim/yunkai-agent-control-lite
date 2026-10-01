# Yunkai Agent Control Lite

A local-first, read-only dashboard for developers who use multiple AI coding tools and local model runtimes.

**Live landing page:** https://yunkailim.github.io/yunkai-agent-control-lite/

## Why this exists

Codex, Claude Code, Gemini CLI, Ollama, and MCP tooling often end up scattered across terminals and settings pages. This Lite build answers one small question:

> What appears installed or running on this machine right now?

It deliberately does less than the private Yunkai Control Center.

## v0.1

- Detects whether Codex, Claude Code, Gemini CLI, and Ollama appear installed.
- Observes matching local process names.
- Probes the local Ollama API and reports only aggregate model count.
- Exports a sanitized status summary.
- Runs on `127.0.0.1`.
- Sends no telemetry.
- Reads no credentials, project files, prompts, transcripts, memories, or MCP configuration.
- Exposes no browser-triggered start / stop / restart actions.

## Run locally

Requirements: Node.js 22+.

```powershell
git clone https://github.com/YunkaiLim/yunkai-agent-control-lite.git
cd yunkai-agent-control-lite
npm start
```

Open:

```text
http://127.0.0.1:4177
```

Tests:

```powershell
npm test
```

## Market test

The current local preview is free.

The initial paid hypothesis is **US$29 lifetime Early Access** for a future version that may add the highest-demand item among:

- MCP server inventory
- provider/model overview
- permission/Human Gate visibility
- reviewed lifecycle controls
- diagnostics/team policy export

Those features are **not promised as already implemented**. The point of this repo is to learn which one is worth building next.

Use the GitHub issue forms to join Early Access or send product feedback.

## Security boundary

Process presence does not mean authentication, authorization, or task readiness.

The Lite build intentionally does not:

- inspect process command lines
- read credentials or secret stores
- read project content
- read prompts/transcripts/memory
- parse MCP configuration
- run arbitrary shell commands from the browser
- mutate local permissions

Please do not paste secrets into public issues.

## License

MIT. The richer private Yunkai Control Center and its internal modules are not part of this repository.
