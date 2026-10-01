import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));
const PRODUCT = 'Yunkai Agent Control Lite';

const AGENT_DEFINITIONS = Object.freeze([
  {
    id: 'codex',
    label: 'Codex',
    commands: ['codex'],
    processNames: ['codex.exe', 'codex']
  },
  {
    id: 'claude',
    label: 'Claude Code',
    commands: ['claude'],
    processNames: ['claude.exe', 'claude-code.exe', 'claude']
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    commands: ['gemini'],
    processNames: ['gemini.exe', 'gemini']
  },
  {
    id: 'ollama',
    label: 'Ollama',
    commands: ['ollama'],
    processNames: ['ollama.exe', 'ollama app.exe', 'ollama']
  }
]);

const CONTENT_TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
});

export function parseTasklistCsv(output) {
  return output
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const match = line.match(/^"((?:[^"]|"")*)"/);
      return match ? match[1].replaceAll('""', '"').toLowerCase() : '';
    })
    .filter(Boolean);
}

export function buildAgentRows(installedById, processNames) {
  const runningNames = new Set(processNames.map(name => name.toLowerCase()));
  return AGENT_DEFINITIONS.map(definition => {
    const installed = Boolean(installedById[definition.id]);
    const running = definition.processNames.some(name => runningNames.has(name.toLowerCase()));
    return {
      id: definition.id,
      label: definition.label,
      installed,
      running,
      state: running ? 'RUNNING' : installed ? 'INSTALLED' : 'NOT_FOUND'
    };
  });
}

export function resolveStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  if (!relative || relative.split(/[\\/]/).includes('..')) return null;

  const publicRoot = resolve(PUBLIC_DIR);
  const candidate = resolve(publicRoot, relative);
  if (candidate !== publicRoot && !candidate.startsWith(publicRoot + sep)) return null;
  return candidate;
}

async function commandExists(command) {
  const program = process.platform === 'win32' ? 'where.exe' : 'which';
  try {
    await execFileAsync(program, [command], {
      windowsHide: true,
      timeout: 1200,
      maxBuffer: 32 * 1024
    });
    return true;
  } catch {
    return false;
  }
}

async function listProcesses() {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('tasklist.exe', ['/fo', 'csv', '/nh'], {
        windowsHide: true,
        timeout: 1500,
        maxBuffer: 1024 * 1024
      });
      return parseTasklistCsv(stdout);
    }

    const { stdout } = await execFileAsync('ps', ['-A', '-o', 'comm='], {
      timeout: 1500,
      maxBuffer: 1024 * 1024
    });
    return stdout
      .split(/\r?\n/)
      .map(line => line.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function probeOllama() {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags', {
      signal: AbortSignal.timeout(900),
      headers: { accept: 'application/json' }
    });
    if (!response.ok) return { state: 'UNAVAILABLE', modelCount: null };

    const payload = await response.json();
    return {
      state: 'READY',
      modelCount: Array.isArray(payload?.models) ? payload.models.length : null
    };
  } catch {
    return { state: 'UNAVAILABLE', modelCount: null };
  }
}

export async function collectStatus() {
  const [processNames, ollama, ...installedFlags] = await Promise.all([
    listProcesses(),
    probeOllama(),
    ...AGENT_DEFINITIONS.map(async definition =>
      definition.commands.some
        ? (await Promise.all(definition.commands.map(commandExists))).some(Boolean)
        : false
    )
  ]);

  const installedById = Object.fromEntries(
    AGENT_DEFINITIONS.map((definition, index) => [definition.id, installedFlags[index]])
  );

  return {
    product: PRODUCT,
    collectedAt: new Date().toISOString(),
    source: 'LOCAL_READ_ONLY_PROBE',
    platform: process.platform,
    agents: buildAgentRows(installedById, processNames),
    localServices: {
      ollama
    },
    security: {
      bind: '127.0.0.1',
      telemetry: false,
      writeActions: false,
      secretsRead: false,
      projectFilesRead: false,
      processCommandLinesRead: false
    },
    capabilities: {
      localToolDiscovery: true,
      processPresence: true,
      ollamaHealth: true,
      mcpInventory: false,
      providerManagement: false,
      startStopRestart: false,
      permissionMutation: false
    },
    caveats: [
      'Process presence is an observation, not proof that an agent is authenticated or usable.',
      'Node-based CLIs may be installed while their running process is not uniquely identifiable.',
      'No project files, prompts, transcripts, credentials, or MCP configuration files are read.'
    ]
  };
}

function applySecurityHeaders(response) {
  response.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Cache-Control', 'no-store');
}

function json(response, statusCode, payload) {
  applySecurityHeaders(response);
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function serveStatic(request, response) {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) {
    json(response, 400, { error: 'INVALID_PATH' });
    return;
  }

  try {
    const body = await readFile(filePath);
    applySecurityHeaders(response);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    });
    if (request.method === 'HEAD') response.end();
    else response.end(body);
  } catch {
    json(response, 404, { error: 'NOT_FOUND' });
  }
}

export function createAppServer() {
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
      json(response, 405, { error: 'READ_ONLY_SERVER' });
      return;
    }

    const url = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (url.pathname === '/health') {
      json(response, 200, {
        status: 'ok',
        product: PRODUCT,
        mode: 'local-read-only'
      });
      return;
    }

    if (url.pathname === '/api/status') {
      try {
        json(response, 200, await collectStatus());
      } catch {
        json(response, 503, { error: 'STATUS_UNAVAILABLE' });
      }
      return;
    }

    await serveStatic(request, response);
  });
}

export function normalizePort(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1024 && parsed <= 65535 ? parsed : 4177;
}

export function startServer() {
  const port = normalizePort(process.env.PORT);
  const server = createAppServer();
  server.listen(port, '127.0.0.1', () => {
    console.log(`${PRODUCT} running at http://127.0.0.1:${port}`);
    console.log('Read-only mode: no telemetry, no secrets, no write actions.');
  });
  return server;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  startServer();
}
