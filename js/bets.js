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
  }
}

/** Clear all bets */
export async function clearBets() {
  bets = [];
  try {
    await fetch(API_URL, { method: 'DELETE', headers: authHeaders() });
  } catch (err) {
    console.error('❌ Error clearing bets:', err.message);
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
  }
}

/** Export all bets to CSV */
export function exportToCSV() {
  const headers = ['Outcome', 'Description', 'Bet Type', 'Odds', 'Stake', 'Payout', 'Profit/Loss', 'Date', 'Event', 'Sport', 'Note'];

  const csvContent = [
    headers.join(','),
    ...bets.map(bet => [
      bet.outcome,
      `"${bet.description || ''}"`,
      bet.betType,
      bet.odds,
      parseFloat(bet.stake).toFixed(2),
      parseFloat(bet.payout).toFixed(2),
      bet.outcome === 'Pending' ? '' : parseFloat(bet.profitLoss).toFixed(2),
      formatDate(bet.date),
      `"${bet.event}"`,
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
  // This can stay as-is for now. If you want to POST demo data to MongoDB, we can adapt it.
  console.warn('⚠️ loadDemoData only works locally. It does not sync to backend.');
}