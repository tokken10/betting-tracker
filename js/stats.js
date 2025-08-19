
import { API_BASE_URL } from './config.js';
import { bets } from './bets.js';

async function fetchUserStats() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    console.error('❌ Error fetching user stats:', err.message);
    alert(err.message || 'Failed to fetch user stats');
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
  };
}

export async function updateStats() {
  const isDemoMode = new URLSearchParams(window.location.search).get('demo');
  const token = localStorage.getItem('token');
  const el = id => document.getElementById(id);

  let stats = null;
  if (!token || isDemoMode) {
    stats = calculateDemoStats();
  } else {
    const user = await fetchUserStats();
    stats = user?.stats;
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
  }
}
