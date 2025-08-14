import { bets } from './bets.js';

export function updateStats() {
  const settled = bets.filter(b => b.outcome === 'Win' || b.outcome === 'Loss');
  const wins = settled.filter(b => b.outcome === 'Win').length;
  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const totalReturn = settled.reduce((sum, b) => sum + b.payout, 0);
  const netProfit = totalReturn - totalStaked;
  const roi = totalStaked > 0 ? (netProfit / totalStaked * 100).toFixed(1) : 0;
  const avgStake = settled.length ? (totalStaked / settled.length).toFixed(2) : '0.00';

  const el = id => document.getElementById(id);

  if (el('totalBets')) el('totalBets').textContent = bets.length;

  if (el('winRate')) {
    const rate = settled.length ? (wins / settled.length) * 100 : 0;
    el('winRate').textContent = rate.toFixed(1) + '%';
    el('winRate').className = 'stat-value ' + (rate >= 50 ? 'positive' : 'negative');
  }

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
    } else {
      streak = 0;
    }
  }
  if (el('winStreak')) el('winStreak').textContent = maxStreak;
  if (el('avgStake')) el('avgStake').textContent = '$' + avgStake;
}
