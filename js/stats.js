import { bets } from './bets.js';
import { API_BASE_URL } from './config.js';

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
    return null;
  }
}

export async function updateStats() {
  const user = await fetchUserStats();

  const settled = bets.filter(b => ['Win', 'Loss', 'Push'].includes(b.outcome));
  const decided = bets.filter(b => b.outcome === 'Win' || b.outcome === 'Loss');
  const avgStake = settled.length ? (settled.reduce((sum, b) => sum + b.stake, 0) / settled.length).toFixed(2) : '0.00';

  const el = id => document.getElementById(id);

  if (user?.stats) {
    const { totalBets, winRate, totalStaked, totalReturn, netProfit, roi } = user.stats;
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
  }

  const profitBySport = {};
  for (let b of settled) {
    if (!profitBySport[b.sport]) profitBySport[b.sport] = 0;
    profitBySport[b.sport] += b.profitLoss;
  }
  const bestSport = Object.entries(profitBySport).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  if (el('bestSport')) el('bestSport').textContent = bestSport;

  let streak = 0;
  let maxStreak = 0;
  for (let b of settled) {
    if (b.outcome === 'Win') {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else if (b.outcome === 'Loss') {
      streak = 0;
    }
    // Push leaves streak unchanged
  }
  if (el('winStreak')) el('winStreak').textContent = maxStreak;
  if (el('avgStake')) el('avgStake').textContent = '$' + avgStake;
}
