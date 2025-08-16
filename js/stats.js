
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
  const el = id => document.getElementById(id);

  if (user?.stats) {
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
    } = user.stats;
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
