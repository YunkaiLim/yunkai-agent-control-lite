# Product Spec — Yunkai Agent Control Lite v0.1

## One-line promise

See which local AI developer tools are installed or running without uploading projects, reading credentials, or granting a dashboard control authority.

## Target user

A developer who uses two or more of:

- Codex
- Claude Code
- Gemini CLI
- Ollama / local models
- MCP tooling

and regularly opens terminals or settings pages just to answer “what is installed / alive right now?”

## v0.1 scope

### In

- Local loopback web UI.
- CLI presence detection.
- Exact executable-name process presence where safely identifiable.
- Ollama localhost health and aggregate model count.
- Sanitized JSON export.
- Explicit trust/boundary copy.

### Out

- Start, stop, restart, repair.
- Arbitrary command execution.
- Credential or token discovery.
- Project, prompt, transcript, or memory reads.
- MCP config parsing.
- Provider login or key management.
- Telemetry.
- Account system.
- Auto-update.

## Why this is smaller than internal Yunkai Control Center

The internal product already has richer Workbench, provider, permission, MCP, lifecycle, and Human Gate surfaces. Those capabilities are intentionally not copied wholesale into the market build because they depend on private paths, reviewed entrypoints, and authority boundaries that do not generalize safely.

The market build reuses the proven design principles:

1. Observation is not authority.
2. Process presence is not readiness.
3. Human gates remain visible rather than silently bypassed.
4. Local-only defaults are product behavior, not marketing copy.

## Acceptance

A stranger can unzip/clone the folder, run `npm start`, open the local page, see an honest status view, and export a sanitized status JSON without configuring credentials.
