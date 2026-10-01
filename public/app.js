(() => {
  const config = window.YUNKAI_MARKET_CONFIG ?? {};
  const agentGrid = document.querySelector('#agent-grid');
  const sourceBadge = document.querySelector('#source-badge');
  const statusNote = document.querySelector('#status-note');
  const ctaStatus = document.querySelector('#cta-status');
  let lastStatus = null;

  const demoStatus = {
    product: config.productName || 'Yunkai Agent Control Lite',
    collectedAt: new Date().toISOString(),
    source: 'DEMO_FALLBACK',
    agents: [
      { id: 'codex', label: 'Codex', installed: true, running: true, state: 'RUNNING' },
      { id: 'claude', label: 'Claude Code', installed: true, running: false, state: 'INSTALLED' },
      { id: 'gemini', label: 'Gemini CLI', installed: true, running: false, state: 'INSTALLED' },
      { id: 'ollama', label: 'Ollama', installed: true, running: true, state: 'RUNNING' }
    ],
    localServices: { ollama: { state: 'READY', modelCount: 6 } },
    security: { bind: '127.0.0.1', telemetry: false, writeActions: false, secretsRead: false },
    caveats: ['Static demo data is shown because the local status API is not available.']
  };

  function tone(state) {
    if (['RUNNING', 'READY'].includes(state)) return 'good';
    if (['INSTALLED'].includes(state)) return 'neutral';
    return 'warn';
  }

  function agentDescription(agent) {
    if (agent.running) return 'Matching local process observed. Authentication and task readiness are not inferred.';
    if (agent.installed) return 'CLI appears installed. No uniquely identifiable running process was observed.';
    return 'CLI was not found on the current command path.';
  }

  function render(status) {
    lastStatus = status;
    const live = status.source === 'LOCAL_READ_ONLY_PROBE';

    sourceBadge.textContent = live ? 'LIVE LOCAL' : 'DEMO MODE';
    sourceBadge.className = `badge ${live ? 'good' : 'warn'}`;

    agentGrid.replaceChildren(...status.agents.map(agent => {
      const card = document.createElement('article');
      card.className = 'agent-card';
      card.innerHTML = `
        <div class="agent-card-head">
          <div>
            <div class="agent-icon">${agent.label.slice(0, 1)}</div>
            <h3>${escapeHtml(agent.label)}</h3>
          </div>
          <span class="status ${tone(agent.state)}">${escapeHtml(agent.state)}</span>
        </div>
        <p>${escapeHtml(agentDescription(agent))}</p>
      `;
      return card;
    }));

    const ollama = status.localServices?.ollama ?? { state: 'UNKNOWN', modelCount: null };
    const ollamaState = document.querySelector('#ollama-state');
    ollamaState.textContent = ollama.state;
    ollamaState.className = `status ${tone(ollama.state)}`;
    document.querySelector('#ollama-api').textContent = ollama.state;
    document.querySelector('#ollama-models').textContent = Number.isInteger(ollama.modelCount) ? String(ollama.modelCount) : '—';

    statusNote.textContent = live
      ? `Observed locally at ${new Date(status.collectedAt).toLocaleTimeString()}. Presence is not authentication, authorization, or task acceptance.`
      : 'Local API unavailable, so the page is showing clearly labeled demo data. Run "npm start" from market-lite for a real local read-only probe.';
  }

  async function refresh() {
    sourceBadge.textContent = 'REFRESHING';
    sourceBadge.className = 'badge neutral';
    try {
      const response = await fetch('/api/status', { cache: 'no-store' });
      if (!response.ok) throw new Error('status unavailable');
      render(await response.json());
    } catch {
      render(demoStatus);
    }
  }

  function sanitizedExport(status) {
    return {
      product: status.product,
      collectedAt: status.collectedAt,
      source: status.source,
      agents: status.agents.map(({ id, label, installed, running, state }) => ({
        id, label, installed, running, state
      })),
      localServices: {
        ollama: {
          state: status.localServices?.ollama?.state ?? 'UNKNOWN',
          modelCount: status.localServices?.ollama?.modelCount ?? null
        }
      },
      security: {
        bind: status.security?.bind ?? '127.0.0.1',
        telemetry: false,
        writeActions: false,
        secretsRead: false
      },
      note: 'Sanitized export intentionally excludes paths, command lines, model names, credentials, projects, prompts, transcripts, and MCP configuration.'
    };
  }

  function exportStatus() {
    if (!lastStatus) return;
    const payload = JSON.stringify(sanitizedExport(lastStatus), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yunkai-agent-control-lite-status.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function openConfiguredUrl(key, pendingMessage) {
    const value = config[key];
    if (typeof value === 'string' && /^https:\/\//i.test(value)) {
      window.open(value, '_blank', 'noopener,noreferrer');
      ctaStatus.textContent = '';
      return;
    }
    ctaStatus.textContent = pendingMessage;
    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function join() {
    openConfiguredUrl('waitlistUrl', 'Waitlist is intentionally not connected yet. Owner signup/configuration is the next external-account step.');
  }

  document.querySelector('#refresh-status')?.addEventListener('click', refresh);
  document.querySelector('#export-status')?.addEventListener('click', exportStatus);
  document.querySelector('#join-header')?.addEventListener('click', join);
  document.querySelector('#join-hero')?.addEventListener('click', join);
  document.querySelector('#join-bottom')?.addEventListener('click', join);
  document.querySelector('#buy-early')?.addEventListener('click', () => {
    openConfiguredUrl('checkoutUrl', 'Checkout is not connected yet. The US$29 price is a market-test hypothesis, not an active purchase button.');
  });
  document.querySelector('#feedback')?.addEventListener('click', () => {
    openConfiguredUrl('feedbackUrl', 'Feedback endpoint is not connected yet. We can attach a form once the external account is chosen.');
  });

  document.querySelector('#early-price').textContent = String(config.earlyAccessPriceUsd ?? 29);

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  refresh();
})();
