export let bets = JSON.parse(localStorage.getItem('bettingData')) || [];

export function saveBets() {
  localStorage.setItem('bettingData', JSON.stringify(bets));
}

export function calculatePayout(odds, stake) {
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

export function loadDemoData() {
  const csv = `League,Start Time,Game,Pick Desc,Type,Period,Odds,Odds/Spread/Total,Result,Units Wagered,Units Net,Money Wagered,Money Net,Tag
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

  const lines = csv.trim().split(/\n/).slice(1);
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
}

export function addBet(bet) {
  bets.push(bet);
  saveBets();
}

export function removeBet(betId) {
  bets = bets.filter(b => b.id !== betId);
  saveBets();
}

export function clearBets() {
  bets = [];
  saveBets();
}

export function settleBet(betId, newOutcome) {
  const bet = bets.find(b => b.id === betId);
  if (!bet) return;

  bet.outcome = newOutcome;

  if (newOutcome === 'Win') {
    bet.payout = calculatePayout(bet.odds, bet.stake);
    bet.profitLoss = bet.payout - bet.stake;
  } else if (newOutcome === 'Loss') {
    bet.payout = 0;
    bet.profitLoss = -bet.stake;
  }

  saveBets();
}

export function exportToCSV() {
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
