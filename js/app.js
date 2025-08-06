import {
  bets,
  addBet as addBetData,
  removeBet as removeBetData,
  clearBets,
  settleBet as settleBetData,
  loadDemoData as loadDemoBets,
  calculatePayout,
  exportToCSV
} from './bets.js';

const outcomeEl = document.getElementById('outcome');
const oddsEl = document.getElementById('odds');
const stakeEl = document.getElementById('stake');

if (outcomeEl && oddsEl && stakeEl) {
  outcomeEl.addEventListener('change', updatePayoutPreview);
  oddsEl.addEventListener('input', updatePayoutPreview);
  stakeEl.addEventListener('input', updatePayoutPreview);
}

// Wait for shared HTML components to load before rendering
window.addEventListener('shared:loaded', () => {
  if (bets.length === 0 && new URLSearchParams(window.location.search).get('demo')) {
    loadDemoBets();
  }
  renderBets();
  updateStats();
});

function updatePayoutPreview() {
  const oddsValue = oddsEl?.value;
  const stake = parseFloat(stakeEl?.value);
  const outcome = outcomeEl?.value;
  const payoutInput = document.getElementById('payout');
  if (!payoutInput) return;
  if (outcome === 'Win' && oddsValue && !isNaN(stake)) {
    payoutInput.value = calculatePayout(oddsValue, stake).toFixed(2);
  } else if (outcome === 'Loss') {
    payoutInput.value = '0.00';
  } else {
    payoutInput.value = '';
  }
}

function handleAddBet() {
  const date = document.getElementById('date').value;
  const sport = document.getElementById('sport').value;
  const event = document.getElementById('event').value;
  const betType = document.getElementById('betType').value;
  const oddsInput = document.getElementById('odds').value.trim();
  const numOdds = parseFloat(oddsInput);
  const odds = (!oddsInput.startsWith('+') && !oddsInput.startsWith('-') && !isNaN(numOdds) && Math.abs(numOdds) >= 100)
    ? `+${oddsInput}`
    : oddsInput;
  const stake = parseFloat(document.getElementById('stake').value) || 0;
  const outcome = document.getElementById('outcome').value;
  const description = document.getElementById('description').value.trim();
  const note = document.getElementById('note').value.trim();

  if (!date || !sport || !event || !betType || !odds || !stake || !outcome) {
    alert('Please fill in all required fields');
    return;
  }

  let payout = 0;
  let profitLoss = 0;

  if (outcome === 'Win') {
    payout = calculatePayout(odds, stake);
    profitLoss = payout - stake;
  } else if (outcome === 'Loss') {
    payout = 0;
    profitLoss = -stake;
  }

  const bet = {
    id: Date.now(),
    date,
    sport,
    event,
    betType,
    odds,
    stake,
    outcome,
    payout,
    profitLoss,
    description,
    note
  };

  addBetData(bet);
  renderBets();
  updateStats();
  clearForm();
}

function handleRemoveBet(id) {
  removeBetData(id);
  renderBets();
  updateStats();
}

function handleClearAll() {
  if (confirm('Are you sure you want to clear all betting data? This cannot be undone.')) {
    clearBets();
    renderBets();
    updateStats();
  }
}

function clearForm() {
  const fields = ['event', 'odds', 'stake', 'payout', 'outcome', 'description', 'note'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function renderBets() {
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
      <td>${bet.date}</td>
      <td>${bet.sport}</td>
      <td class="event-cell">
        <div class="event-content" title="${bet.event}" onclick="showFullText(${JSON.stringify(bet.event)})">
          ${bet.event}
        </div>
      </td>
      <td>${bet.betType}</td>
      <td class="description-cell">
        <div class="description-content" title="${bet.description || ''}" onclick="showFullText(${JSON.stringify(bet.description || '')})">
          ${bet.description || ''}
        </div>
      </td>
      <td>${bet.odds}</td>
      <td>$${bet.stake.toFixed(2)}</td>
      <td>${bet.outcome}</td>
      <td>$${bet.payout.toFixed(2)}</td>
      <td class="${profitClass}">
        ${bet.outcome === 'Pending' ? '—' : profitSymbol + '$' + bet.profitLoss.toFixed(2)}
      </td>
      <td class="note-cell">
        <div class="note-content" title="${bet.note || ''}" onclick="showFullText(${JSON.stringify(bet.note || '')})">
          ${bet.note || ''}
        </div>
      </td>
      <td>
        ${
          bet.outcome === 'Pending'
            ? `
              <select onchange="settleBet(this, ${bet.id})">
                <option value="">Settle</option>
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
              </select>
              <button class="btn btn-danger" onclick="removeBet(${bet.id})">Remove</button>
            `
            : `<button class="btn btn-danger" onclick="removeBet(${bet.id})">Remove</button>`
        }
      </td>
    `;

    tbody.appendChild(row);
  });
}

function handleSettleBet(selectEl, betId) {
  const newOutcome = selectEl.value;
  if (!newOutcome) return;
  settleBetData(betId, newOutcome);
  renderBets();
  updateStats();
}

function updateStats() {
  const settled = bets.filter(b => b.outcome === 'Win' || b.outcome === 'Loss');
  const wins = settled.filter(b => b.outcome === 'Win').length;
  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const totalReturn = settled.reduce((sum, b) => sum + b.payout, 0);
  const netProfit = totalReturn - totalStaked;
  const roi = totalStaked > 0 ? (netProfit / totalStaked * 100).toFixed(1) : 0;
  const avgStake = settled.length ? (totalStaked / settled.length).toFixed(2) : '0.00';

  const el = id => document.getElementById(id);

  if (el('totalBets')) el('totalBets').textContent = bets.length;
  if (el('winRate')) el('winRate').textContent = settled.length ? ((wins / settled.length) * 100).toFixed(1) + '%' : '0%';
  if (el('totalStaked')) el('totalStaked').textContent = '$' + totalStaked.toFixed(2);
  if (el('totalReturn')) el('totalReturn').textContent = '$' + totalReturn.toFixed(2);

  if (el('netProfit')) {
    el('netProfit').textContent = (netProfit >= 0 ? '+' : '') + '$' + netProfit.toFixed(2);
    el('netProfit').className = 'stat-value ' + (netProfit >= 0 ? 'positive' : 'negative');
  }

  if (el('roi')) {
    el('roi').textContent = (roi >= 0 ? '+' : '') + roi + '%';
    el('roi').className = 'stat-value ' + (roi >= 0 ? 'positive' : 'negative');
  }

  if (el('profile-total-bets')) el('profile-total-bets').textContent = bets.length;
  if (el('profile-avg-stake')) el('profile-avg-stake').textContent = '$' + avgStake;

  const profitBySport = {};
  for (let b of settled) {
    if (!profitBySport[b.sport]) profitBySport[b.sport] = 0;
    profitBySport[b.sport] += b.profitLoss;
  }
  const bestSport = Object.entries(profitBySport).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  if (el('profile-best-sport')) el('profile-best-sport').textContent = bestSport;

  let streak = 0;
  let maxStreak = 0;
  for (let b of settled) {
    if (b.outcome === 'Win') {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  }
  if (el('profile-win-streak')) el('profile-win-streak').textContent = maxStreak;
}

function showFullText(text) {
  const modal = document.getElementById('textModal');
  const modalText = document.getElementById('modalText');
  if (modal && modalText) {
    modalText.textContent = text || '';
    modal.classList.add('active');
  }
}

function closeModal() {
  const modal = document.getElementById('textModal');
  if (modal) modal.classList.remove('active');
}

// Expose functions globally for HTML event handlers
window.addBet = handleAddBet;
window.removeBet = handleRemoveBet;
window.clearAllBets = handleClearAll;
window.loadDemoData = () => { loadDemoBets(); renderBets(); updateStats(); };
window.settleBet = handleSettleBet;
window.showFullText = showFullText;
window.closeModal = closeModal;
window.exportToCSV = exportToCSV;
