import { bets, removeBet as removeBetData, settleBet as settleBetData } from './bets.js';
import { updateStats } from './stats.js';
import { formatDate, escapeHtml } from './utils.js';
import { showBetDetails } from './modal.js';

const DEFAULT_PAGE_SIZE = 25;
let currentPage = 1;
let pageSize = DEFAULT_PAGE_SIZE;
let lastSortKey = null;
let lastSortOrder = null;

function ensurePaginationListeners() {
  const pageSizeSelect = document.getElementById('pageSize');
  if (pageSizeSelect && !pageSizeSelect.dataset.bound) {
    pageSizeSelect.dataset.bound = 'true';
    pageSizeSelect.addEventListener('change', event => {
      const nextSize = Number(event.target.value);
      if (!Number.isFinite(nextSize) || nextSize <= 0) return;
      pageSize = nextSize;
      currentPage = 1;
      renderBets();
    });
  }

  const map = [
    ['paginationFirst', () => goToPage(1)],
    ['paginationPrev', () => goToPage(currentPage - 1)],
    ['paginationNext', () => goToPage(currentPage + 1)],
    ['paginationLast', () => goToPage('last')],
  ];

  map.forEach(([id, handler]) => {
    const button = document.getElementById(id);
    if (button && !button.dataset.bound) {
      button.dataset.bound = 'true';
      button.addEventListener('click', handler);
    }
  });
}

function goToPage(page) {
  const totalPages = Math.max(1, Math.ceil(bets.length / pageSize));
  let targetPage;

  if (page === 'last') {
    targetPage = totalPages;
  } else {
    targetPage = Number(page);
  }

  if (!Number.isFinite(targetPage)) return;

  targetPage = Math.min(Math.max(targetPage, 1), totalPages);

  if (targetPage === currentPage) return;

  currentPage = targetPage;
  renderBets();
}

function updatePaginationUI(totalBets, startIndex, visibleCount, totalPages) {
  const summary = document.getElementById('paginationSummary');
  if (summary) {
    if (totalBets === 0) {
      summary.textContent = 'No bets to display';
    } else {
      const first = startIndex + 1;
      const last = startIndex + visibleCount;
      summary.textContent = `Showing ${first}–${last} of ${totalBets} • Page ${currentPage} of ${totalPages}`;
    }
  }

  const disablePrev = currentPage <= 1 || totalBets === 0;
  const disableNext = currentPage >= totalPages || totalBets === 0;

  const buttonStates = [
    ['paginationFirst', disablePrev],
    ['paginationPrev', disablePrev],
    ['paginationNext', disableNext],
    ['paginationLast', disableNext],
  ];

  buttonStates.forEach(([id, disabled]) => {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = disabled;
    }
  });

  const pageSizeSelect = document.getElementById('pageSize');
  if (pageSizeSelect && pageSizeSelect.value !== String(pageSize)) {
    pageSizeSelect.value = String(pageSize);
  }
}

export function resetPagination() {
  currentPage = 1;
}

export function showTableLoading(rows = 5) {
  const tbody = document.getElementById('betsTable');
  if (!tbody) return;
  tbody.innerHTML = '';

  for (let i = 0; i < rows; i++) {
    const row = document.createElement('tr');
    row.className = 'loading-row';

    for (let j = 0; j < 11; j++) {
      const cell = document.createElement('td');
      cell.innerHTML = '<div class="loading-placeholder"></div>';
      row.appendChild(cell);
    }

    tbody.appendChild(row);
  }
}

export async function handleRemoveBet(id) {
  await removeBetData(id);
  renderBets();
  await updateStats();
}

export async function handleSettleBet(selectEl, betId) {
  const newOutcome = selectEl.value;
  if (!newOutcome) return;
  await settleBetData(betId, newOutcome);
  renderBets();
  await updateStats();
}

export function renderBets() {
  const tbody = document.getElementById('betsTable');
  if (!tbody) return;

  ensurePaginationListeners();

  tbody.innerHTML = '';

  const sortBy = document.getElementById('sortBy')?.value || 'date';
  const sortOrder = document.getElementById('sortOrder')?.value || 'desc';

  if (sortBy !== lastSortKey || sortOrder !== lastSortOrder) {
    currentPage = 1;
    lastSortKey = sortBy;
    lastSortOrder = sortOrder;
  }

  const sorted = [...bets].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (['profitLoss', 'stake', 'payout'].includes(sortBy)) {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    if (sortBy === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (!Number.isFinite(pageSize) || pageSize <= 0) {
    pageSize = DEFAULT_PAGE_SIZE;
  }

  const totalBets = sorted.length;
  const totalPages = totalBets === 0 ? 1 : Math.ceil(totalBets / pageSize);
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = totalBets === 0 ? 0 : (currentPage - 1) * pageSize;
  const visibleBets = totalBets === 0 ? [] : sorted.slice(startIndex, startIndex + pageSize);

  updatePaginationUI(totalBets, startIndex, visibleBets.length, totalPages);

  if (visibleBets.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-state';
    emptyRow.innerHTML = `<td colspan="13">No bets yet. Add your first bet to start tracking!</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  visibleBets.forEach(bet => {
    const row = document.createElement('tr');
    row.className = bet.outcome.toLowerCase();
    row.tabIndex = 0;

    const profitClass = bet.profitLoss > 0 ? 'positive' : bet.profitLoss < 0 ? 'negative' : '';
    const profitSymbol = bet.profitLoss > 0 ? '+' : '';

    const safeOutcome = escapeHtml(bet.outcome);
    const safeEvent = escapeHtml(bet.event);
    const safeDescription = escapeHtml(bet.description || '');
    const safeBetType = escapeHtml(bet.betType);
    const safeOdds = escapeHtml(bet.odds);
    const safeSport = escapeHtml(bet.sport);
    const safeClosingOdds = escapeHtml(bet.closingOdds || '');
    const safeSportsbook = escapeHtml(bet.sportsbook || '');
    const safeNote = escapeHtml(bet.note || '');

    row.innerHTML = `
      <td>${safeOutcome}</td>
      <td class="event-cell">
        <div class="event-content" title="${safeEvent}" onclick="showFullText(${JSON.stringify(bet.event)})">
          ${safeEvent}
        </div>
      </td>
      <td class="description-cell">
        <div class="description-content" title="${safeDescription}" onclick="showFullText(${JSON.stringify(bet.description || '')})">
          ${safeDescription}
        </div>
      </td>
      <td>${safeBetType}</td>
      <td>${safeOdds}</td>
      <td>${safeClosingOdds || '—'}</td>
      <td>$${parseFloat(bet.stake).toFixed(2)}</td>
      <td>$${parseFloat(bet.payout).toFixed(2)}</td>
      <td class="${profitClass}">
        ${bet.outcome === 'Pending' ? '—' : profitSymbol + '$' + parseFloat(bet.profitLoss).toFixed(2)}
      </td>
      <td>${formatDate(bet.date)}</td>
      <td>${safeSport}</td>
      <td>${safeSportsbook || '—'}</td>
      <td class="note-cell">
        <div class="note-content" title="${safeNote}" onclick="showFullText(${JSON.stringify(bet.note || '')})">
          ${safeNote}
        </div>
      </td>
    `;

    row.addEventListener('click', () => {
      showBetDetails(bet);
    });
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showBetDetails(bet);
      }
    });

    tbody.appendChild(row);
  });
}