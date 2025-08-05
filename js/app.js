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
mlb,2025-07-05T18:20:00.000Z,STL @ CHC,STL @ CHC: u11 -105,under,game,-105,11,loss,105,-105,105,-105,
mlb,2025-07-05T20:05:00.000Z,CIN @ PHI,CIN @ PHI: u8.5 -102,under,game,-102,8.5,win,102,100,102,100,
mlb,2025-07-05T20:10:00.000Z,NYY @ NYM,NYM +1.5 -135,spread_home,game,-135,1.5,win,135,100,135,100,
mlb,2025-07-05T20:10:00.000Z,MIL @ MIA,(Live) MIL -1.5 +118,spread_away,game,118,-1.5,loss,84.75,-84.75,84.75,-84.75,
mlb,2025-07-05T20:10:00.000Z,KC @ ARI,KC @ ARI: u9 -115,under,game,-115,9,win,115,100,115,100,
mlb,2025-07-05T23:15:00.000Z,HOU @ LAD,HOU +124,ml_away,game,124,124,win,80.65,100.006,80.65,100.006,
mlb,2025-07-06T02:10:00.000Z,PIT @ SEA,PIT +145,ml_away,game,145,145,loss,68.97,-68.97,68.97,-68.97,
mlb,2025-07-06T17:40:00.000Z,MIL @ MIA,MIL -105,ml_away,game,-105,-105,win,105,100,105,100,
mlb,2025-07-06T17:40:00.000Z,DET @ CLE,DET @ CLE: u7.5 -120,under,game,-120,7.5,loss,120,-120,120,-120,
mlb,2025-07-06T17:40:00.000Z,NYY @ NYM,NYY @ NYM: u9 -115,under,game,-115,9,loss,115,-115,115,-115,
mlb,2025-07-06T18:10:00.000Z,TB @ MIN,TB @ MIN: u8 -102,under,game,-102,8,loss,102,-102,102,-102,
mlb,2025-07-06T22:10:00.000Z,STL @ CHC,(Live) STL @ CHC: o7.5 +108,over,game,108,7.5,win,92.59,99.9972,92.59,99.9972,
mlb,2025-07-07T22:40:00.000Z,TB @ DET,TB @ DET: u8.5 -106,under,game,-106,8.5,win,106,100,106,100,
mlb,2025-07-07T23:40:00.000Z,LAD @ MIL,LAD @ MIL: u7.5 -102,under,game,-102,7.5,loss,102,-102,102,-102,
mlb,2025-07-08T00:10:00.000Z,CLE @ HOU,HOU -137,ml_home,game,-137,-137,loss,137,-137,137,-137,
mlb,2025-07-08T01:38:00.000Z,TEX @ LAA,TEX @ LAA: u7.5 -110,under,game,-110,7.5,loss,110,-110,110,-110,
mlb,2025-07-11T19:10:00.000Z,CLE @ CWS,CLE -119,ml_away,game,-119,-119,win,119,100,119,100,
mlb,2025-07-11T23:05:00.000Z,CHC @ NYY,NYY -1.5 +110,spread_home,game,110,-1.5,win,90.91,100.001,90.91,100.001,
mlb,2025-07-11T23:10:00.000Z,TB @ BOS,TB -105,ml_away,game,-105,-105,loss,105,-105,105,-105,
mlb,2025-07-11T23:10:00.000Z,COL @ CIN,COL @ CIN: u9.5 -119,under,game,-119,9.5,win,119,100,119,100,
mlb,2025-07-11T23:10:00.000Z,SEA @ DET,DET -1.5 -102,spread_home,game,-102,-1.5,loss,102,-102,102,-102,
mlb,2025-07-12T17:05:00.000Z,CHC @ NYY,CHC +1.5 -154,spread_away,game,-154,1.5,win,110,71.4286,110,71.4286,
mlb,2025-07-12T18:15:00.000Z,ATL @ STL,ATL @ STL: o9.5 -101,over,game,-101,9.5,win,101,100,101,100,
mlb,2025-07-12T20:05:00.000Z,MIA @ BAL,MIA @ BAL: u9 +105,under,game,105,9,win,95.24,100.002,95.24,100.002,
mlb,2025-07-12T20:10:00.000Z,NYM @ KC,KC +110,ml_home,game,110,110,loss,90.91,-90.91,90.91,-90.91,
mlb,2025-07-12T20:10:00.000Z,TB @ BOS,BOS -174,ml_home,game,-174,-174,win,110,63.2184,110,63.2184,
mlb,2025-07-13T17:35:00.000Z,MIA @ BAL,MIA +107,ml_away,game,107,107,win,93.46,100.0022,93.46,100.0022,
mlb,2025-07-13T17:35:00.000Z,TB @ BOS,BOS -120,ml_home,game,-120,-120,win,120,100,120,100,
mlb,2025-07-13T17:40:00.000Z,COL @ CIN,COL @ CIN: o9.5 -105,over,game,-105,9.5,loss,105,-105,105,-105,
mlb,2025-07-13T17:40:00.000Z,SEA @ DET,DET -110,ml_home,game,-110,-110,loss,110,-110,110,-110,
mlb,2025-07-13T18:10:00.000Z,CLE @ CWS,CLE @ CWS: u8.5 -105,under,game,-105,8.5,loss,105,-105,105,-105,
mlb,2025-07-16T00:00:00.000Z,AL @ NL,NL -132,ml_home,game,-132,-132,win,132,100,132,100,
mlb,2025-07-18T22:40:00.000Z,CWS @ PIT,CWS @ PIT: o8.5 -114,over,game,-114,8.5,win,114,100,114,100,
mlb,2025-07-18T22:45:00.000Z,LAA @ PHI,PHI -205,ml_home,game,-205,-205,loss,110,-110,110,-110,
mlb,2025-07-18T22:45:00.000Z,SD @ WSH,SD @ WSH: o8.5 -101,over,game,-101,8.5,win,101,100,101,100,
mlb,2025-07-18T23:10:00.000Z,KC @ MIA,KC -119,ml_away,game,-119,-119,loss,119,-119,119,-119,
mlb,2025-07-18T23:10:00.000Z,CIN @ NYM,CIN @ NYM: u7.5 -111,under,game,-111,7.5,loss,111,-111,111,-111,
mlb,2025-07-20T19:10:00.000Z,MIN @ COL,MIN @ COL: o10.5 -105,over,game,-105,10.5,loss,105,-105,105,-105,
mlb,2025-07-20T20:10:00.000Z,HOU @ SEA,HOU @ SEA: u6.5 -110,under,game,-110,6.5,loss,110,-110,110,-110,
mlb,2025-07-20T20:10:00.000Z,MIL @ LAD,MIL +1.5 -140,spread_away,game,-140,1.5,win,110,78.5714,110,78.5714,
mlb,2025-07-20T20:10:00.000Z,STL @ ARI,ARI -140,ml_home,game,-140,-140,win,110,78.5714,110,78.5714,
mlb,2025-07-25T22:40:00.000Z,ARI @ PIT,ARI -111,ml_away,game,-111,-111,win,111,100,111,100,
mlb,2025-07-25T23:05:00.000Z,PHI @ NYY,NYY -156,ml_home,game,-156,-156,loss,156,-156,156,-156,
mlb,2025-07-26T00:05:00.000Z,ATL @ TEX,TEX -1.5 +140,spread_home,game,140,-1.5,win,71.43,100.002,71.43,100.002,
mlb,2025-07-26T02:15:00.000Z,NYM @ SF,SF -136,ml_home,game,-136,-136,loss,136,-136,136,-136,
nfl,2025-08-01T00:00:00.000Z,LAC @ DET,LAC @ DET: u33.5 -110,under,game,-110,33.5,loss,110,-110,110,-110,`;

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