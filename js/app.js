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
  const csv = `League,Start Time,Game,Pick Desc,Type,Period,Odds,Odds/Spread/Total,Result,Units Wagered,Units Net,Money Wagered,Money Net,Tag
nfl,2025-08-01T00:00:00.000Z,LAC @ DET,LAC @ DET: u33.5 -110,under,game,-110,33.5,loss,110,-110,110,-110,
ncaaf,2025-08-23T08:00:00.000Z,Cc,Cc: u8.5 +120,under,game,120,8.5,pending,110,0,110,0,
ncaaf,2025-08-23T09:00:00.000Z,To Make the Playoffs 2025-26,Miami Florida To Make The Playoffs,future,game,N/A,,pending,110,0,110,0,
ncaaf,2025-08-23T10:00:00.000Z,Miami FL ACC Regular Season Wins 2025-26,Miami FL ACC Regular Season Wins 2025-26: No -250,future,game,-250,,pending,110,0,110,0,
ncaaf,2025-08-23T12:00:00.000Z,Iowa State (#21) @ Kansas State (#20),Iowa State (#21) +3.5 -115,spread_away,game,-115,3.5,pending,110,0,110,0,
ncaaf,2025-08-30T14:30:00.000Z,Old Dominion @ Indiana (#19),Indiana (#19) -23.5 -110,spread_home,game,-110,-23.5,pending,110,0,110,0,
ncaaf,2025-08-30T15:30:00.000Z,Alabama (#8) @ Florida State,Alabama (#8) @ Florida State: o50.5 -110,over,game,-110,50.5,pending,110,0,110,0,
ncaaf,2025-08-30T15:30:00.000Z,Nevada @ Penn State (#3),Penn State (#3) -44.5 -115,spread_home,game,-115,-44.5,pending,110,0,110,0,
ncaaf,2025-08-30T19:30:00.000Z,LSU (#9) @ Clemson (#6),LSU (#9) @ Clemson (#6): u57 -105,under,game,-105,57,pending,110,0,110,0,
ncaaf,2025-08-31T15:00:00.000Z,Virginia Tech @ South Carolina (#13),Virginia Tech +8.5 -110,spread_away,game,-110,8.5,pending,110,0,110,0,
ncaaf,2025-08-31T19:30:00.000Z,Notre Dame (#5) @ Miami Florida (#10),Notre Dame (#5) -2.5 -110,spread_away,game,-110,-2.5,pending,110,0,110,0,
nfl,2025-09-07T13:00:00.000Z,49ers Regular Season Wins 2025-26,49ers Regular Season Wins 2025-26: u10.5 -120,under,game,-120,10.5,pending,110,0,110,0,`;

  const lines = csv.trim().split('\n').slice(1);
  bets = lines.map((line, index) => {
    const [league, startTime, game, pickDesc, type, period, odds, lineValue, result, unitsWagered, unitsNet, moneyWagered, moneyNet, tag] = line.split(',');
    const date = startTime.split('T')[0];
    const stake = parseFloat(moneyWagered);
    const profitLoss = parseFloat(moneyNet);
    const outcome = result.trim().charAt(0).toUpperCase() + result.trim().slice(1);
    const numOdds = parseFloat(odds);
    const formattedOdds = (odds.startsWith('-') || odds.startsWith('+') || isNaN(numOdds))
      ? odds
      : numOdds >= 100
        ? `+${odds}`
        : odds;
    return {
      id: Date.now() + index,
      date,
      sport: league.toUpperCase(),
      event: game,
      betType: type.replace(/_/g, ' '),
      odds: formattedOdds,
      stake,
      outcome,
      payout: outcome === 'Win' ? stake + profitLoss : 0,
      profitLoss,
      description: pickDesc,
      note: tag || ''
    };
  });
  saveBets();
  renderBets();
  updateStats();
}

function calculatePayout(odds, stake) {
  const numOdds = parseFloat(odds);
  if (isNaN(numOdds) || isNaN(stake)) return 0;

  const isAmerican = odds.startsWith('+') || odds.startsWith('-') || Math.abs(numOdds) >= 100;

  if (!isAmerican) {
    // Decimal odds
    return stake * numOdds;
  }

  // American odds
  return numOdds > 0
    ? stake + (stake * (numOdds / 100))
    : stake + (stake / Math.abs(numOdds)) * 100;
}

function updatePayoutPreview() {
  const oddsValue = document.getElementById('odds')?.value;
  const stake = parseFloat(document.getElementById('stake')?.value);
  const outcome = document.getElementById('outcome')?.value;
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

function addBet() {
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