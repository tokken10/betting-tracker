import { bets, removeBet as removeBetData, settleBet as settleBetData } from './bets.js';
import { updateStats } from './stats.js';
import { formatDate } from './utils.js';

export async function handleRemoveBet(id) {
  await removeBetData(id);
  renderBets();
  updateStats();
}

export async function handleSettleBet(selectEl, betId) {
  const newOutcome = selectEl.value;
  if (!newOutcome) return;
  await settleBetData(betId, newOutcome);
  renderBets();
  updateStats();
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
      <td>
        ${
          bet.outcome === 'Pending'
            ? `
              <select onchange="settleBet(this, '${bet._id}')">
                <option value="">Settle</option>
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Push">Push</option>
              </select>
              <button class="btn btn-danger" onclick="removeBet('${bet._id}')">Remove</button>
            `
            : `<button class="btn btn-danger" onclick="removeBet('${bet._id}')">Remove</button>`
        }
      </td>
    `;

    tbody.appendChild(row);
  });
}