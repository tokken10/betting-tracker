import mongoose from 'mongoose';

const BetSchema = new mongoose.Schema({
  date: String,
  sport: String,
  event: String,
  betType: String,
  odds: String,
  stake: Number,
  outcome: String,
  payout: Number,
  profitLoss: Number,
  description: String,
  note: String,
});

export default mongoose.model('Bet', BetSchema);
