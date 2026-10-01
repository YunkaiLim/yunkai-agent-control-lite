# Security Policy

Yunkai Agent Control Lite is intentionally local-first and read-only.

## Please do not publish secrets

Do not include API keys, tokens, credentials, private prompts, project contents, or private configuration in a public issue.

For a security-sensitive report, use GitHub's private security reporting / security advisory flow for this repository when available.

## v0.1 boundary

The browser UI has no write-action endpoint. The local service binds to 127.0.0.1, sends no telemetry, does not inspect process command lines, and does not read credential stores, projects, prompts, transcripts, memory, or MCP configuration.

Process presence is not treated as proof of authentication, authorization, or task readiness.
