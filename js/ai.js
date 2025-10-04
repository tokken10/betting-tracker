import { API_BASE_URL } from './config.js';
import { escapeHtml } from './utils.js';

const threadEl = document.getElementById('ai-thread');
const questionInput = document.getElementById('ai-question');
const sendBtn = document.getElementById('send-question-btn');
const hintsEl = document.getElementById('ai-hints');
const contextMetricsEl = document.getElementById('context-metrics');
const contextExtraEl = document.getElementById('context-extra');
const breakdownsEl = document.getElementById('context-breakdowns');
const followUpsEl = document.getElementById('follow-ups');
const chartCanvas = document.getElementById('ai-chart');
const chartCaption = document.getElementById('chart-caption');
const filterControls = document.getElementById('filter-controls');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const scopeRadios = document.querySelectorAll('input[name="analysisScope"]');

let currentScope = 'all';
let selectedFilters = {};
let conversation = [];
let isStreaming = false;
let lastContext = null;
let defaultHints = [
  'What does my ROI look like this season?',
  'Show profit by sport.',
  'Where am I running cold?'
];
let loginWarningShown = false;

function toggleInteractionEnabled(enabled) {
  const disabled = !enabled;
  if (questionInput) {
    questionInput.disabled = disabled;
  }
  if (sendBtn) {
    sendBtn.disabled = disabled || (enabled ? isStreaming : true);
  }
  scopeRadios.forEach(radio => {
    radio.disabled = disabled;
  });
  if (applyFiltersBtn) {
    applyFiltersBtn.disabled = disabled;
  }
  if (filterControls) {
    const interactiveNodes = filterControls.querySelectorAll('input, select, button');
    interactiveNodes.forEach(node => {
      if (node === sendBtn) return;
      node.disabled = disabled;
    });
  }
}

async function fetchCurrentUser() {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('❌ Unable to fetch current user:', err?.message || err);
    return null;
  }
}

async function waitForCurrentUser() {
  if (window.CURRENT_USER !== undefined) {
    return window.CURRENT_USER;
  }

  return new Promise(resolve => {
    let resolved = false;

    const finish = (user) => {
      if (resolved) return;
      resolved = true;
      resolve(user);
    };

    const handleSharedLoaded = () => {
      if (window.CURRENT_USER !== undefined) {
        window.removeEventListener('shared:loaded', handleSharedLoaded);
        finish(window.CURRENT_USER);
      }
    };

    window.addEventListener('shared:loaded', handleSharedLoaded);

    fetchCurrentUser().then(user => {
      if (resolved) return;
      window.removeEventListener('shared:loaded', handleSharedLoaded);
      if (window.CURRENT_USER === undefined) {
        window.CURRENT_USER = user;
      }
      finish(window.CURRENT_USER);
    }).catch(() => {
      // If fetching fails we still rely on the shared:loaded event.
    });
  });
}

async function ensureLoggedIn() {
  const me = window.CURRENT_USER || null;
  if (!me) {
    if (!loginWarningShown) {
      appendSystemMessage('Sign in to chat with the AI analyst.');
      loginWarningShown = true;
    }
    toggleInteractionEnabled(false);
    return false;
  }
  toggleInteractionEnabled(true);
  return true;
}

function appendMessage(role, text = '') {
  if (!threadEl) return null;
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  wrapper.appendChild(bubble);
  threadEl.appendChild(wrapper);
  threadEl.scrollTop = threadEl.scrollHeight;
  return bubble;
}

function setBubbleText(bubble, text) {
  if (!bubble) return;
  bubble.innerHTML = escapeHtml(text).replace(/\n/g, '<br>');
  threadEl.scrollTop = threadEl.scrollHeight;
}

function appendSystemMessage(text) {
  appendMessage('system', text);
}

function renderHints(hints) {
  if (!hintsEl) return;
  const list = hints && hints.length ? hints : defaultHints;
  hintsEl.innerHTML = '';
  list.forEach(hint => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hint-chip';
    button.textContent = hint;
    button.addEventListener('click', () => {
      if (questionInput) {
        questionInput.value = hint;
        questionInput.focus();
      }
    });
    hintsEl.appendChild(button);
  });
}

function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (typeof value !== 'number') return value;
  if (options.type === 'currency') {
    return (value < 0 ? '-' : '') + '$' + Math.abs(value).toFixed(options.decimals ?? 2);
  }
  if (options.type === 'percent') {
    return (value >= 0 ? '+' : '') + value.toFixed(options.decimals ?? 1) + '%';
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: options.decimals ?? 2 });
}

function renderMetrics(metrics) {
  if (!contextMetricsEl || !metrics) return;
  const items = [
    { label: 'Total Bets', value: metrics.totalBets },
    { label: 'Win Rate', value: metrics.winRatePct, format: 'percent' },
    { label: 'ROI', value: metrics.roiPct, format: 'percent' },
    { label: 'Net Profit', value: metrics.netProfit, format: 'currency' },
    { label: 'Avg Odds (decimal)', value: metrics.avgOdds, format: null },
    { label: 'CLV', value: metrics.clvPct, format: 'percent' },
    { label: 'Longest Win Streak', value: metrics.longestWinStreak },
    { label: 'Longest Loss Streak', value: metrics.longestLossStreak },
  ];
  contextMetricsEl.innerHTML = items
    .map(item => `
      <div class="metric-row">
        <span class="metric-label">${escapeHtml(item.label)}</span>
        <span class="metric-value">${formatNumber(item.value, item.format === 'currency'
          ? { type: 'currency' }
          : item.format === 'percent'
            ? { type: 'percent', decimals: 1 }
            : { maximumFractionDigits: 2 })}</span>
      </div>
    `)
    .join('');
}

function renderExtra(context) {
  if (!contextExtraEl || !context?.dataset) return;
  const { dataset, issues } = context;
  const rows = [
    { label: 'Scope', value: context.scope === 'filtered' ? 'Filtered slice' : 'All bets' },
    { label: 'Resolved', value: dataset.resolvedBets },
    { label: 'Pending', value: dataset.pendingBets },
    { label: 'Pending Exposure', value: formatNumber(dataset.pendingExposure, { type: 'currency' }) },
    { label: 'Date Range', value: dataset.firstBetDate && dataset.lastBetDate
        ? `${dataset.firstBetDate.slice(0, 10)} → ${dataset.lastBetDate.slice(0, 10)}`
        : '—' },
    { label: 'Closing Odds Coverage', value: formatNumber(dataset.closingCoveragePct, { type: 'percent', decimals: 1 }) },
  ];
  contextExtraEl.innerHTML = rows
    .map(row => `
      <div class="metric-row">
        <span class="metric-label">${escapeHtml(row.label)}</span>
        <span class="metric-value">${typeof row.value === 'string' ? escapeHtml(row.value) : row.value}</span>
      </div>
    `)
    .join('');

  if (issues?.length) {
    const issuesList = document.createElement('ul');
    issuesList.className = 'issue-list';
    issues.forEach(issue => {
      const li = document.createElement('li');
      li.textContent = issue;
      issuesList.appendChild(li);
    });
    contextExtraEl.appendChild(issuesList);
  }
}

function renderBreakdowns(breakdowns) {
  if (!breakdownsEl) return;
  const bySportEntries = Object.entries(breakdowns?.bySport || {});
  const byMarketEntries = Object.entries(breakdowns?.byMarket || {});
  const monthEntries = breakdowns?.byMonth || [];

  const sportHtml = bySportEntries.length
    ? `<h4>By Sport</h4><ul>${bySportEntries
        .map(([sport, data]) => `<li><strong>${escapeHtml(sport)}:</strong> ${formatNumber(data.netProfit, { type: 'currency' })} (${formatNumber(data.roiPct, { type: 'percent', decimals: 1 })} ROI)</li>`)
        .join('')}</ul>`
    : '';
  const marketHtml = byMarketEntries.length
    ? `<h4>By Market</h4><ul>${byMarketEntries
        .map(([market, data]) => `<li><strong>${escapeHtml(market)}:</strong> ${formatNumber(data.netProfit, { type: 'currency' })} (${formatNumber(data.roiPct, { type: 'percent', decimals: 1 })} ROI)</li>`)
        .join('')}</ul>`
    : '';
  const monthHtml = monthEntries.length
    ? `<h4>Monthly Net</h4><ul>${monthEntries
        .map(point => `<li>${escapeHtml(String(point.x))}: ${formatNumber(point.y, { type: 'currency' })}</li>`)
        .join('')}</ul>`
    : '';
  breakdownsEl.innerHTML = sportHtml + marketHtml + monthHtml || '<p class="muted">Breakdown data will appear after your first analysis.</p>';
}

function renderFollowUps(followUps) {
  if (!followUpsEl) return;
  followUpsEl.innerHTML = '';
  (followUps || []).forEach(question => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = question;
    btn.addEventListener('click', () => {
      if (questionInput) {
        questionInput.value = question;
        questionInput.focus();
      }
    });
    li.appendChild(btn);
    followUpsEl.appendChild(li);
  });
}

function clearChart() {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  chartCaption.textContent = '';
}

function drawChart(chart, fallbackSeries, fallbackTitle = 'Performance trend') {
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  const hasChartSeries = Boolean(chart?.series?.length && chart.series[0]?.points?.length);
  const usingFallback = !hasChartSeries && Array.isArray(fallbackSeries) && fallbackSeries.length;
  const series = hasChartSeries
    ? chart.series
    : usingFallback
      ? [{ name: 'Net Profit', points: fallbackSeries }]
      : [];

  if (!series.length || !series[0].points?.length) {
    chartCaption.textContent = 'No chart available for this slice yet.';
    return;
  }
  const points = series[0].points;
  // Slightly larger padding to fit axis labels
  const padding = 36;
  const width = chartCanvas.width - padding * 2;
  const height = chartCanvas.height - padding * 2;
  const values = points.map(p => p.y);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Draw Y-axis ticks and grid lines for better readability
  const ticks = 4; // min, ~1/3, ~2/3, max
  ctx.strokeStyle = '#e5ecf4';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#6b7a8f';
  ctx.font = '11px sans-serif';
  for (let i = 0; i <= ticks; i++) {
    const t = i / ticks;
    const val = minVal + (1 - t) * range; // top to bottom
    const y = padding + t * height;
    // grid line
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + width, y);
    ctx.stroke();
    // label
    const label = formatNumber(val, { decimals: 1 });
    ctx.fillText(label, 6, y - 2);
  }

  ctx.strokeStyle = '#1f78d1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * width;
    const y = padding + (1 - (point.y - minVal) / range) * height;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  if (chart?.type === 'area') {
    ctx.lineTo(padding + width, padding + height);
    ctx.lineTo(padding, padding + height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(31,120,209,0.15)';
    ctx.fill();
  }

  if (chart?.type === 'bar') {
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    // redraw grid and y-axis labels after clearing
    ctx.strokeStyle = '#e5ecf4';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7a8f';
    ctx.font = '11px sans-serif';
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const val = minVal + (1 - t) * range;
      const y = padding + t * height;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + width, y);
      ctx.stroke();
      const label = formatNumber(val, { decimals: 1 });
      ctx.fillText(label, 6, y - 2);
    }
    ctx.fillStyle = '#1f78d1';
    const barWidth = width / points.length * 0.6;
    points.forEach((point, index) => {
      const x = padding + index * (width / points.length) + (width / points.length - barWidth) / 2;
      const y = padding + (1 - (point.y - minVal) / range) * height;
      const barHeight = padding + height - y;
      ctx.fillRect(x, y, barWidth, barHeight);
      // Numeric label above each bar
      ctx.fillStyle = '#2c3e50';
      ctx.font = '11px sans-serif';
      const label = formatNumber(point.y, { decimals: 1 });
      const textWidth = ctx.measureText(label).width;
      ctx.fillText(label, x + (barWidth - textWidth) / 2, y - 4);
      ctx.fillStyle = '#1f78d1';
    });
    ctx.strokeStyle = '#1f78d1';
  }

  // Draw points and, for line/area charts, label the last point
  ctx.fillStyle = '#2c3e50';
  ctx.font = '12px sans-serif';
  points.forEach((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * width;
    const y = padding + (1 - (point.y - minVal) / range) * height;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  if (chart?.type !== 'bar') {
    const last = points[points.length - 1];
    const lastX = padding + ((points.length - 1) / Math.max(points.length - 1, 1)) * width;
    const lastY = padding + (1 - (last.y - minVal) / range) * height;
    const label = formatNumber(last.y, { decimals: 1 });
    ctx.fillStyle = '#1f2a37';
    ctx.font = '11px sans-serif';
    ctx.fillText(label, lastX + 6, lastY - 6);
  }

  const caption = chart?.title || (usingFallback ? fallbackTitle : 'Performance trend');
  chartCaption.textContent = caption;
}

function renderContext(payload) {
  if (!payload) return;
  renderMetrics(payload.metrics);
  renderExtra(payload.context);
  renderBreakdowns(payload.breakdowns);
  renderFollowUps(payload.followUps);
  const fallback = payload.breakdowns?.equityCurve;
  drawChart(payload.chart, fallback, 'Net profit/loss over time');
}

async function loadContext({ scope = currentScope, filters = selectedFilters } = {}) {
  const me = window.CURRENT_USER || null;
  if (!me) return;
  const params = new URLSearchParams();
  if (scope === 'filtered') {
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (!value) return;
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.set(key, value);
      }
    });
  }
  const url = `${API_BASE_URL}/ai/context${params.toString() ? `?${params}` : ''}`;
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Failed to load AI context');
    }
    const data = await res.json();
    lastContext = {
      metrics: data.metrics,
      breakdowns: data.breakdowns,
      chart: null,
      followUps: [],
      context: {
        scope: data.scope,
        filters: data.filters,
        dataset: data.dataset,
        drawdown: data.drawdown,
        issues: data.issues,
      },
    };
    renderMetrics(lastContext.metrics);
    renderExtra(lastContext.context);
    renderBreakdowns(lastContext.breakdowns);
    drawChart(null, data.breakdowns?.equityCurve, 'Net profit/loss over time');
    renderHints();
    populateFilterOptions(data.availableFilters);
    if (!data.aiKeyConfigured) {
      appendSystemMessage('AI analyst is not enabled. Add your OpenAI key in Settings or contact the admin.');
      if (questionInput) questionInput.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
    }
  } catch (err) {
    console.error('❌ Error loading AI context:', err.message);
    appendSystemMessage('Unable to load AI context. Please refresh.');
  }
}

function populateFilterOptions(facets) {
  if (!facets) return;
  const sportsSelect = document.getElementById('filter-sports');
  const marketsSelect = document.getElementById('filter-markets');
  const outcomesSelect = document.getElementById('filter-outcomes');

  function fillSelect(select, values) {
    if (!select) return;
    const existing = new Set(Array.from(select.options).map(opt => opt.value));
    values.forEach(value => {
      if (!existing.has(value)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      }
    });
  }

  fillSelect(sportsSelect, facets.sports || []);
  fillSelect(marketsSelect, facets.betTypes || []);
  fillSelect(outcomesSelect, facets.outcomes || []);
}

function readFiltersFromForm() {
  const filters = {};
  const start = document.getElementById('filter-start')?.value;
  const end = document.getElementById('filter-end')?.value;
  if (start) filters.startDate = start;
  if (end) filters.endDate = end;
  const sports = document.getElementById('filter-sports');
  const markets = document.getElementById('filter-markets');
  const outcomes = document.getElementById('filter-outcomes');
  if (sports) {
    const values = Array.from(sports.selectedOptions).map(opt => opt.value);
    if (values.length) filters.sports = values;
  }
  if (markets) {
    const values = Array.from(markets.selectedOptions).map(opt => opt.value);
    if (values.length) filters.betTypes = values;
  }
  if (outcomes) {
    const values = Array.from(outcomes.selectedOptions).map(opt => opt.value);
    if (values.length) filters.outcomes = values;
  }
  return filters;
}

function buildRequestBody(message) {
  return {
    message,
    scope: currentScope,
    filters: currentScope === 'filtered' ? selectedFilters : {},
    history: conversation.slice(-6),
  };
}

function handleSseEvent(event, data, streamState) {
  switch (event) {
    case 'token': {
      streamState.buffer += data;
      setBubbleText(streamState.bubble, streamState.buffer);
      break;
    }
    case 'payload': {
      try {
        const payload = JSON.parse(data);
        streamState.finalPayload = payload;
        setBubbleText(streamState.bubble, payload.answer || streamState.buffer);
        renderContext(payload);
        renderHints(payload.followUps);
      } catch (err) {
        console.error('❌ Failed to parse payload:', err.message);
      }
      break;
    }
    case 'error': {
      appendSystemMessage('The analyst encountered an error. Please try again.');
      break;
    }
    default:
      break;
  }
}

async function streamAnalysis(message) {
  const me = window.CURRENT_USER || null;
  if (!me) return;

  const requestBody = buildRequestBody(message);
  const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok || !response.body) {
    const error = await response.json().catch(() => ({ error: 'Failed to reach AI analyst.' }));
    throw new Error(error.error || 'Failed to reach AI analyst.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const streamState = { bubble: appendMessage('assistant', ''), buffer: '', finalPayload: null };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) >= 0) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (!chunk.trim()) continue;
      const lines = chunk.split('\n');
      const eventLine = lines.find(line => line.startsWith('event:'));
      const dataLines = lines.filter(line => line.startsWith('data:')).map(line => line.replace(/^data:\s?/, ''));
      const event = eventLine ? eventLine.replace('event:', '').trim() : 'message';
      const data = dataLines.join('\n');
      handleSseEvent(event, data, streamState);
    }
  }

  if (buffer.trim()) {
    const lines = buffer.split('\n');
    const eventLine = lines.find(line => line.startsWith('event:'));
    const dataLines = lines.filter(line => line.startsWith('data:')).map(line => line.replace(/^data:\s?/, ''));
    const event = eventLine ? eventLine.replace('event:', '').trim() : 'message';
    const data = dataLines.join('\n');
    handleSseEvent(event, data, streamState);
  }

  return streamState.finalPayload || { answer: streamState.buffer };
}

async function onSend() {
  if (isStreaming || !questionInput) return;
  const message = questionInput.value.trim();
  if (!message) return;
  appendMessage('user', message);
  conversation.push({ role: 'user', content: message });
  questionInput.value = '';
  isStreaming = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const payload = await streamAnalysis(message);
    conversation.push({ role: 'assistant', content: payload.answer || '' });
  } catch (err) {
    console.error('❌ AI streaming error:', err.message);
    appendSystemMessage(err.message);
  } finally {
    isStreaming = false;
    if (sendBtn) sendBtn.disabled = false;
  }
}

function initScopeControls() {
  scopeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      currentScope = radio.value;
      if (currentScope === 'filtered') {
        filterControls?.removeAttribute('hidden');
      } else {
        filterControls?.setAttribute('hidden', '');
        selectedFilters = {};
        loadContext({ scope: 'all', filters: {} });
      }
    });
  });

  applyFiltersBtn?.addEventListener('click', async () => {
    selectedFilters = readFiltersFromForm();
    if (!Object.keys(selectedFilters).length) {
      appendSystemMessage('Choose at least one filter or use the "Analyze all bets" option.');
      return;
    }
    await loadContext({ scope: 'filtered', filters: selectedFilters });
  });
}

function initInput() {
  if (!questionInput) return;
  questionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  });
  sendBtn?.addEventListener('click', onSend);
}

async function init() {
  toggleInteractionEnabled(false);
  await waitForCurrentUser();
  if (!(await ensureLoggedIn())) return;
  await loadContext();
  initScopeControls();
  initInput();
  renderHints();
}

init();
