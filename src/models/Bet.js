import mongoose from 'mongoose';

const BetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    sportsbook: String,
    closingOdds: String,
  },
  { timestamps: true }
);

export default mongoose.model('Bet', BetSchema);
