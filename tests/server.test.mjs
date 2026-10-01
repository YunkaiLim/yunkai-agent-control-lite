import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentRows, normalizePort, parseTasklistCsv, resolveStaticPath } from '../server.mjs';

test('parseTasklistCsv extracts only image names', () => {
  const input = [
    '"codex.exe","1234","Console","1","12,345 K"',
    '"ollama.exe","9876","Console","1","99,999 K"'
  ].join('\r\n');
  assert.deepEqual(parseTasklistCsv(input), ['codex.exe', 'ollama.exe']);
});

test('buildAgentRows distinguishes running, installed, and missing', () => {
  const rows = buildAgentRows(
    { codex: true, claude: true, gemini: false, ollama: true },
    ['codex.exe', 'ollama.exe']
  );
  assert.equal(rows.find(row => row.id === 'codex').state, 'RUNNING');
  assert.equal(rows.find(row => row.id === 'claude').state, 'INSTALLED');
  assert.equal(rows.find(row => row.id === 'gemini').state, 'NOT_FOUND');
  assert.equal(rows.find(row => row.id === 'ollama').state, 'RUNNING');
});

test('resolveStaticPath refuses traversal', () => {
  assert.equal(resolveStaticPath('/../server.mjs'), null);
  assert.equal(resolveStaticPath('/%2e%2e/server.mjs'), null);
  assert.ok(resolveStaticPath('/styles.css').endsWith('styles.css'));
});

test('normalizePort uses a safe fallback', () => {
  assert.equal(normalizePort('4180'), 4180);
  assert.equal(normalizePort('80'), 4177);
  assert.equal(normalizePort('not-a-port'), 4177);
});
