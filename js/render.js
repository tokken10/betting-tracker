import { bets, removeBet as removeBetData, settleBet as settleBetData } from './bets.js';
import { updateStats } from './stats.js';
import { formatDate } from './utils.js';
import { showBetDetails } from './modal.js';

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

  sorted.forEach(bet => {
    const row = document.createElement('tr');
    row.className = bet.outcome.toLowerCase();
    row.tabIndex = 0;

    const profitClass = bet.profitLoss > 0 ? 'positive' : bet.profitLoss < 0 ? 'negative' : '';
    const profitSymbol = bet.profitLoss > 0 ? '+' : '';

      row.innerHTML = `
        <td>${bet.outcome}</td>
        <td class="event-cell">
          <div class="event-content" title="${bet.event}" onclick="showFullText(${JSON.stringify(bet.event)})">
            ${bet.event}
          </div>
        </td>
        <td class="description-cell">
          <div class="description-content" title="${bet.description || ''}" onclick="showFullText(${JSON.stringify(bet.description || '')})">
            ${bet.description || ''}
          </div>
        </td>
      <td>${bet.betType}</td>
      <td>${bet.odds}</td>
      <td>$${parseFloat(bet.stake).toFixed(2)}</td>
      <td>$${parseFloat(bet.payout).toFixed(2)}</td>
      <td class="${profitClass}">
        ${bet.outcome === 'Pending' ? '—' : profitSymbol + '$' + parseFloat(bet.profitLoss).toFixed(2)}
      </td>
        <td>${formatDate(bet.date)}</td>
      <td>${bet.sport}</td>
      <td class="note-cell">
        <div class="note-content" title="${bet.note || ''}" onclick="showFullText(${JSON.stringify(bet.note || '')})">
          ${bet.note || ''}
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