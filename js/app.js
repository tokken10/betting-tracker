let bets = JSON.parse(localStorage.getItem('bettingData')) || [];

document.getElementById('date').valueAsDate = new Date();

document.getElementById('outcome').addEventListener('change', updatePayoutPreview);
document.getElementById('odds').addEventListener('input', updatePayoutPreview);
document.getElementById('stake').addEventListener('input', updatePayoutPreview);

function saveBets() {
  localStorage.setItem('bettingData', JSON.stringify(bets));
}

function loadDemoData() {
  bets = [
    {
      id: Date.now(),
      date: '2023-09-01',
      sport: 'Football',
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
      sport: 'Basketball',
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
  const odds = parseFloat(document.getElementById('odds').value);
  const stake = parseFloat(document.getElementById('stake').value);
  const outcome = document.getElementById('outcome').value;
  const payoutInput = document.getElementById('payout');

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

function removeBet(button) {
  const row = button.closest('tr');
  const index = Array.from(row.parentNode.children).indexOf(row);
  bets.splice(index, 1);
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
  tbody.innerHTML = '';

  const sortBy = document.getElementById('sortBy')?.value || 'date';
  const sortOrder = document.getElementById('sortOrder')?.value || 'desc';

  const sortedBets = [...bets].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (sortBy === 'profitLoss' || sortBy === 'stake' || sortBy === 'payout') {
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

  sortedBets.forEach(bet => {
    const row = document.createElement('tr');
    row.className = bet.outcome.toLowerCase();

    const profitClass = bet.profitLoss > 0 ? 'positive' : bet.profitLoss < 0 ? 'negative' : '';
    const profitSymbol = bet.profitLoss > 0 ? '+' : '';

    row.innerHTML = `
  <td>${bet.date}</td>
  <td>${bet.sport}</td>
  <td>${bet.event}</td>
  <td>${bet.betType}</td>
  <td>${bet.description || ''}</td>
  <td>${bet.odds}</td>
  <td>$${bet.stake.toFixed(2)}</td>
  <td>${bet.outcome}</td>
  <td>$${bet.payout.toFixed(2)}</td>
  <td class="${profitClass}">${
    bet.outcome === 'Pending' ? '—' : profitSymbol + '$' + bet.profitLoss.toFixed(2)
  }</td>
  <td>${bet.note || ''}</td>
  <td>
    ${
      bet.outcome === 'Pending'
        ? `
          <select onchange="settleBet(this, ${bet.id})">
            <option value="">Settle</option>
            <option value="Win">Win</option>
            <option value="Loss">Loss</option>
          </select>
          <button class="btn btn-danger" onclick="removeBet(this)">Remove</button>
        `
        : `<button class="btn btn-danger" onclick="removeBet(this)">Remove</button>`
    }
  </td>
`;

    tbody.appendChild(row);
  });
}

function settleBet(selectEl, betId) {
  const newOutcome = selectEl.value;
  if (!newOutcome) return;

  const betIndex = bets.findIndex(bet => bet.id === betId);
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
  const settledBets = bets.filter(bet => bet.outcome === 'Win' || bet.outcome === 'Loss');

  const totalBets = bets.length;
  const wins = settledBets.filter(bet => bet.outcome === 'Win').length;
  const winRate = settledBets.length > 0 ? (wins / settledBets.length * 100).toFixed(1) : 0;
  const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalReturn = settledBets.reduce((sum, bet) => sum + bet.payout, 0);
  const netProfit = totalReturn - totalStaked;
  const roi = totalStaked > 0 ? (netProfit / totalStaked * 100).toFixed(1) : 0;

  document.getElementById('totalBets').textContent = totalBets;
  document.getElementById('winRate').textContent = winRate + '%';
  document.getElementById('totalStaked').textContent = '$' + totalStaked.toFixed(2);
  document.getElementById('totalReturn').textContent = '$' + totalReturn.toFixed(2);

  const netProfitEl = document.getElementById('netProfit');
  netProfitEl.textContent = (netProfit >= 0 ? '+' : '') + '$' + netProfit.toFixed(2);
  netProfitEl.style.color = netProfit >= 0 ? '#27ae60' : '#e74c3c';

  const roiEl = document.getElementById('roi');
  roiEl.textContent = (roi >= 0 ? '+' : '') + roi + '%';
  roiEl.style.color = roi >= 0 ? '#27ae60' : '#e74c3c';
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

if (bets.length === 0 && new URLSearchParams(window.location.search).get('demo')) {
  loadDemoData();
} else {
  renderBets();
  updateStats();
}