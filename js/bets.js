import { formatDate } from './utils.js';
import { API_BASE_URL } from './config.js';
export let bets = [];

const API_URL = `${API_BASE_URL}/bets`;

function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
}

/** Fetch all bets from the backend */
export async function fetchBets() {
  try {
    const res = await fetch(API_URL, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch bets');
    bets = await res.json();
  } catch (err) {
    console.error('❌ Error fetching bets:', err.message);
    bets = [];
    alert(err.message || 'Failed to fetch bets');
  }
}

/** Calculate payout based on odds and stake */
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

/** Add a new bet */
export async function addBet(bet) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(bet),
    });
    const savedBet = await res.json();
    bets.push(savedBet);
  } catch (err) {
    console.error('❌ Error adding bet:', err.message);
    alert(err.message || 'Failed to add bet');
  }
}

/** Remove a bet by _id */
export async function removeBet(betId) {
  try {
    await fetch(`${API_URL}/${betId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    bets = bets.filter(b => b._id !== betId);
  } catch (err) {
    console.error('❌ Error removing bet:', err.message);
    alert(err.message || 'Failed to remove bet');
  }
}

/** Clear all bets */
export async function clearBets() {
  bets = [];
  try {
    await fetch(API_URL, { method: 'DELETE', headers: authHeaders() });
  } catch (err) {
    console.error('❌ Error clearing bets:', err.message);
    alert(err.message || 'Failed to clear bets');
  }
}

/** Settle a bet by updating its outcome and recalculating */
export async function settleBet(betId, newOutcome) {
  const bet = bets.find(b => b._id === betId);
  if (!bet) return;

  bet.outcome = newOutcome;

  if (newOutcome === 'Win') {
    bet.payout = calculatePayout(bet.odds, bet.stake);
    bet.profitLoss = bet.payout - bet.stake;
  } else if (newOutcome === 'Loss') {
    bet.payout = 0;
    bet.profitLoss = -bet.stake;
  } else if (newOutcome === 'Push') {
    bet.payout = bet.stake;
    bet.profitLoss = 0;
  }

  try {
    const res = await fetch(`${API_URL}/${betId}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(bet),
    });

    const updatedBet = await res.json();
    const index = bets.findIndex(b => b._id === betId);
    if (index !== -1) {
      bets[index] = updatedBet;
    }
  } catch (err) {
    console.error('❌ Error settling bet:', err.message);
    alert(err.message || 'Failed to update bet');
  }
}

/** Export all bets to CSV */
export function exportToCSV() {
  const headers = ['Outcome', 'Event', 'Description', 'Bet Type', 'Odds', 'Stake', 'Payout', 'Profit/Loss', 'Date', 'Sport', 'Note'];

  const csvContent = [
    headers.join(','),
    ...bets.map(bet => [
      bet.outcome,
      `"${bet.event}"`,
      `"${bet.description || ''}"`,
      bet.betType,
      bet.odds,
      parseFloat(bet.stake).toFixed(2),
      parseFloat(bet.payout).toFixed(2),
      bet.outcome === 'Pending' ? '' : parseFloat(bet.profitLoss).toFixed(2),
      formatDate(bet.date),
      bet.sport,
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

/** Load hardcoded demo data (for local-only testing) */
export function loadDemoData() {
  bets = [
    {
      _id: 'demo-1',
      outcome: 'Win',
      event: 'Eagles vs Giants',
      description: 'Eagles -3.5',
      betType: 'Point Spread',
      odds: '-110',
      stake: 110,
      payout: calculatePayout('-110', 110),
      profitLoss: calculatePayout('-110', 110) - 110,
      date: '2024-01-15T00:00:00.000Z',
      sport: 'NFL Football',
      note: 'Sample win'
    },
    {
      _id: 'demo-2',
      outcome: 'Loss',
      event: 'Lakers vs Celtics',
      description: 'Lakers -2',
      betType: 'Point Spread',
      odds: '-105',
      stake: 105,
      payout: 0,
      profitLoss: -105,
      date: '2024-02-20T00:00:00.000Z',
      sport: 'NBA Basketball',
      note: 'Sample loss'
    },
    {
      _id: 'demo-3',
      outcome: 'Pending',
      event: 'Yankees vs Red Sox',
      description: 'Over 8.5',
      betType: 'Over/Under',
      odds: '-110',
      stake: 110,
      payout: 0,
      profitLoss: 0,
      date: '2024-03-10T00:00:00.000Z',
      sport: 'Baseball',
      note: ''
    },
    {
      _id: 'demo-4',
      outcome: 'Win',
      event: 'Packers vs Bears',
      description: 'Packers ML',
      betType: 'Moneyline',
      odds: '+120',
      stake: 100,
      payout: calculatePayout('+120', 100),
      profitLoss: calculatePayout('+120', 100) - 100,
      date: '2024-04-12T00:00:00.000Z',
      sport: 'NFL Football',
      note: 'Dog hits'
    },
    {
      _id: 'demo-5',
      outcome: 'Loss',
      event: 'Knicks vs Bulls',
      description: 'Over 210.5',
      betType: 'Over/Under',
      odds: '-110',
      stake: 110,
      payout: 0,
      profitLoss: -110,
      date: '2024-05-01T00:00:00.000Z',
      sport: 'NBA Basketball',
      note: 'High scoring attempt'
    },
    {
      _id: 'demo-6',
      outcome: 'Pending',
      event: 'Patriots vs Dolphins',
      description: 'Under 43.5',
      betType: 'Over/Under',
      odds: '-105',
      stake: 105,
      payout: 0,
      profitLoss: 0,
      date: '2024-06-15T00:00:00.000Z',
      sport: 'NFL Football',
      note: ''
    },
    {
      _id: 'demo-7',
      outcome: 'Win',
      event: 'Hurricanes vs Penguins',
      description: 'Hurricanes +1.5',
      betType: 'Puck Line',
      odds: '-130',
      stake: 130,
      payout: calculatePayout('-130', 130),
      profitLoss: calculatePayout('-130', 130) - 130,
      date: '2024-07-20T00:00:00.000Z',
      sport: 'NHL Hockey',
      note: 'Sample hockey win'
    },
    {
      _id: 'demo-8',
      outcome: 'Push',
      event: 'Spain vs France',
      description: 'Spain +1',
      betType: 'Point Spread',
      odds: '-110',
      stake: 110,
      payout: 110,
      profitLoss: 0,
      date: '2024-08-05T00:00:00.000Z',
      sport: 'Soccer',
      note: 'Push sample'
    }
  ];
}