const mongoose = require('mongoose');

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

module.exports = mongoose.model('Bet', BetSchema);