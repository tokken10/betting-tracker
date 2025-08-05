let bets = JSON.parse(localStorage.getItem('bettingData')) || [];

const outcomeEl = document.getElementById('outcome');
const oddsEl = document.getElementById('odds');
const stakeEl = document.getElementById('stake');

if (outcomeEl && oddsEl && stakeEl) {
  outcomeEl.addEventListener('change', updatePayoutPreview);
  oddsEl.addEventListener('input', updatePayoutPreview);
  stakeEl.addEventListener('input', updatePayoutPreview);
}

// ✅ Delay rendering until shared HTML is loaded
window.addEventListener('shared:loaded', () => {
  if (bets.length === 0 && new URLSearchParams(window.location.search).get('demo')) {
    loadDemoData();
  } else {
    renderBets();
    updateStats();
  }
});

function saveBets() {
  localStorage.setItem('bettingData', JSON.stringify(bets));
}

function loadDemoData() {
  bets = [
    {
      id: Date.now(),
      date: '2023-09-01',
      sport: 'NFL Football',
      event: 'Team A vs Team B',
      betType: 'Moneyline',
      odds: '+150',
      stake: 50,
      outcome: 'Win',
      payout: calculatePayout('+150', 50),
      profitLoss: calculatePayout('+150', 50) - 50,
      description: 'Team A ML',
      note: 'Demo'
    },
    {
      id: Date.now() + 1,
      date: '2023-09-02',
      sport: 'NBA Basketball',
      event: 'Team C vs Team D',
      betType: 'Point Spread',
      odds: '-110',
      stake: 40,
      outcome: 'Loss',
      payout: 0,
      profitLoss: -40,
      description: 'Team C -3.5',
      note: ''
    },
    {
      id: Date.now() + 2,
      date: '2023-09-03',
      sport: 'Baseball',
      event: 'Team E vs Team F',
      betType: 'Over/Under',
      odds: '-105',
      stake: 20,
      outcome: 'Pending',
      payout: 0,
      profitLoss: 0,
      description: 'Over 8.5',
      note: ''
    }
  ];
  saveBets();
  renderBets();
  updateStats();
}

function calculatePayout(odds, stake) {
  const numOdds = parseFloat(odds);
  if (isNaN(numOdds) || isNaN(stake)) return 0;

  return numOdds > 0
    ? stake + (stake * (numOdds / 100))
    : stake + (stake / Math.abs(numOdds)) * 100;
}

function updatePayoutPreview() {
  const odds = parseFloat(document.getElementById('odds')?.value);
  const stake = parseFloat(document.getElementById('stake')?.value);
  const outcome = document.getElementById('outcome')?.value;
  const payoutInput = document.getElementById('payout');

  if (!payoutInput) return;

  if (outcome === 'Win' && !isNaN(odds) && !isNaN(stake)) {
    payoutInput.value = calculatePayout(odds, stake).toFixed(2);
  } else if (outcome === 'Loss') {
    payoutInput.value = '0.00';
  } else {
    payoutInput.value = '';
  }
}

function addBet() {
  const date = document.getElementById('date').value;
  const sport = document.getElementById('sport').value;
  const event = document.getElementById('event').value;
  const betType = document.getElementById('betType').value;
  const odds = document.getElementById('odds').value;
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

  bets.push(bet);
  saveBets();
  renderBets();
  updateStats();
  clearForm();
}

function removeBet(betId) {
  bets = bets.filter(bet => bet.id !== betId);
  saveBets();
  renderBets();
  updateStats();
}

function clearAllBets() {
  if (confirm('Are you sure you want to clear all betting data? This cannot be undone.')) {
    bets = [];
    saveBets();
    renderBets();
    updateStats();
  }
}

function clearForm() {
  document.getElementById('event').value = '';
  document.getElementById('odds').value = '';
  document.getElementById('stake').value = '';
  document.getElementById('payout').value = '';
  document.getElementById('outcome').value = '';
  document.getElementById('description').value = '';
  document.getElementById('note').value = '';
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

function settleBet(selectEl, betId) {
  const newOutcome = selectEl.value;
  if (!newOutcome) return;

  const betIndex = bets.findIndex(b => b.id === betId);
  if (betIndex === -1) return;

  const bet = bets[betIndex];
  bet.outcome = newOutcome;

  if (newOutcome === 'Win') {
    bet.payout = calculatePayout(bet.odds, bet.stake);
    bet.profitLoss = bet.payout - bet.stake;
  } else if (newOutcome === 'Loss') {
    bet.payout = 0;
    bet.profitLoss = -bet.stake;
  }

  saveBets();
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

  const el = (id) => document.getElementById(id);

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

function exportToCSV() {
  const headers = ['Date', 'Sport', 'Event', 'Bet Type', 'Odds', 'Stake', 'Outcome', 'Payout', 'Profit/Loss', 'Description', 'Note'];

  const csvContent = [
    headers.join(','),
    ...bets.map(bet => [
      bet.date,
      bet.sport,
      bet.event,
      bet.betType,
      bet.odds,
      bet.stake.toFixed(2),
      bet.outcome,
      bet.payout.toFixed(2),
      bet.outcome === 'Pending' ? '' : bet.profitLoss.toFixed(2),
      `"${bet.description || ''}"`,
      `"${bet.note || ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'betting_tracker_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}