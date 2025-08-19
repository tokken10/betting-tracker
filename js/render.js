import { bets, removeBet as removeBetData, settleBet as settleBetData } from './bets.js';
import { updateStats } from './stats.js';
import { formatDate, escapeHtml } from './utils.js';
import { showBetDetails } from './modal.js';

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

  tbody.innerHTML = '';

  const sortBy = document.getElementById('sortBy')?.value || 'date';
  const sortOrder = document.getElementById('sortOrder')?.value || 'desc';

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

  if (sorted.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.className = 'empty-state';
    emptyRow.innerHTML = `<td colspan="11">No bets yet. Add your first bet to start tracking!</td>`;
    tbody.appendChild(emptyRow);
    return;
  }

  sorted.forEach(bet => {
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
      <td>$${parseFloat(bet.stake).toFixed(2)}</td>
      <td>$${parseFloat(bet.payout).toFixed(2)}</td>
      <td class="${profitClass}">
        ${bet.outcome === 'Pending' ? '—' : profitSymbol + '$' + parseFloat(bet.profitLoss).toFixed(2)}
      </td>
      <td>${formatDate(bet.date)}</td>
      <td>${safeSport}</td>
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