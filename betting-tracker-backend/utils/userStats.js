const Bet = require('../models/Bet');
const User = require('../models/User');

async function updateUserStats(userId) {
  const bets = await Bet.find({ user: userId });
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


  await User.findByIdAndUpdate(
    userId,
    {
      stats: {
        totalBets: bets.length,
        winRate,
        roi,
        totalStaked,
        totalReturn,
        netProfit,
        mostProfitable,
        avgStake,
        winStreak,

      },
    },
    { new: true }
  );
}

module.exports = { updateUserStats };
