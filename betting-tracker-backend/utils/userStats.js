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
      },
    },
    { new: true }
  );
}

module.exports = { updateUserStats };
