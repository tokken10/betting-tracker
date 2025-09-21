
import { API_BASE_URL } from './config.js';
import { bets } from './bets.js';

function impliedProbFromOdds(odds) {
  if (!odds) return null;
  const str = String(odds).trim();
  if (!str) return null;
  const value = Number(str);
  if (!Number.isFinite(value)) return null;
  const isDecimal = str.includes('.') && Math.abs(value) < 100;
  if (!isDecimal && (str.startsWith('+') || str.startsWith('-') || Math.abs(value) >= 100)) {
    if (value > 0) {
      return 100 / (value + 100);
    }
    if (value < 0) {
      return Math.abs(value) / (Math.abs(value) + 100);
    }
    return null;
  }
  return value > 0 ? 1 / value : null;
}

async function fetchUserStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching user stats:', err.message);
    return null;
  }
}

function calculateDemoStats() {
  const settled = bets.filter(b => ['Win', 'Loss', 'Push'].includes(b.outcome));
  const decided = bets.filter(b => b.outcome === 'Win' || b.outcome === 'Loss');
  const wins = decided.filter(b => b.outcome === 'Win').length;
  const totalStaked = settled.reduce((sum, b) => sum + (b.stake || 0), 0);
  const totalReturn = settled.reduce((sum, b) => sum + (b.payout || 0), 0);
  const netProfit = totalReturn - totalStaked;
  const winRate = decided.length ? (wins / decided.length) * 100 : 0;
  const roi = totalStaked > 0 ? (netProfit / totalStaked) * 100 : 0;
  const avgStake = settled.length ? totalStaked / settled.length : 0;

  const profitBySport = {};
  for (const b of settled) {
    const profit = b.profitLoss || 0;
    profitBySport[b.sport] = (profitBySport[b.sport] || 0) + profit;
  }
  const mostProfitable = Object.entries(profitBySport).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  let streak = 0;
  let maxStreak = 0;
  for (const b of settled) {
    if (b.outcome === 'Win') {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else if (b.outcome === 'Loss') {
      streak = 0;
    }
  }
  const winStreak = maxStreak;
  const pendingExposure = bets
    .filter(b => b.outcome === 'Pending')
    .reduce((sum, b) => sum + (b.stake || 0), 0);

  const clvEntries = bets
    .map(b => {
      const open = impliedProbFromOdds(b.odds);
      const close = impliedProbFromOdds(b.closingOdds);
      if (open === null || close === null) return null;
      return (close - open) * 100;
    })
    .filter(value => value !== null);
  const clv = clvEntries.length
    ? clvEntries.reduce((sum, value) => sum + value, 0) / clvEntries.length
    : null;

  return {
    totalBets: bets.length,
    winRate,
    roi,
    totalStaked,
    totalReturn,
    netProfit,
    mostProfitable,
    avgStake,
    winStreak,
    clv,
    pendingExposure,
  };
}

export async function updateStats() {
  const isDemoMode = new URLSearchParams(window.location.search).get('demo');
  const el = id => document.getElementById(id);

  let stats = null;
  if (isDemoMode) {
    stats = calculateDemoStats();
  } else {
    const user = await fetchUserStats();
    stats = user?.stats || calculateDemoStats();
  }

  if (stats) {
    const {
      totalBets,
      winRate,
      roi,
      totalStaked,
      totalReturn,
      netProfit,
      mostProfitable,
      avgStake,
      winStreak,
      clv,
    } = stats;
    if (el('totalBets')) el('totalBets').textContent = totalBets;
    if (el('winRate')) el('winRate').textContent = winRate.toFixed(1) + '%';
    if (el('totalStaked')) el('totalStaked').textContent = '$' + totalStaked.toFixed(2);
    if (el('totalReturn')) el('totalReturn').textContent = '$' + totalReturn.toFixed(2);
    if (el('netProfit')) {
      el('netProfit').textContent = (netProfit >= 0 ? '+' : '') + '$' + netProfit.toFixed(2);
      el('netProfit').className = 'stat-value ' + (netProfit >= 0 ? 'positive' : 'negative');
    }
    if (el('roi')) {
      el('roi').textContent = (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%';
      el('roi').className = 'stat-value ' + (roi >= 0 ? 'positive' : 'negative');
    }
    if (el('bestSport')) el('bestSport').textContent = mostProfitable || '-';
    if (el('avgStake')) el('avgStake').textContent = '$' + avgStake.toFixed(2);
    if (el('winStreak')) el('winStreak').textContent = winStreak;
    if (el('clv')) {
      if (clv === null || Number.isNaN(clv)) {
        el('clv').textContent = '—';
        el('clv').className = 'stat-value';
      } else {
        el('clv').textContent = (clv >= 0 ? '+' : '') + clv.toFixed(1) + '%';
        el('clv').className = 'stat-value ' + (clv >= 0 ? 'positive' : 'negative');
      }
    }
  }
}
