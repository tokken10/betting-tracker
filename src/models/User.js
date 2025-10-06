import mongoose from 'mongoose';

const StatsSchema = new mongoose.Schema(
  {
    totalBets: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    totalStaked: { type: Number, default: 0 },
    totalReturn: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    mostProfitable: { type: String, default: '-' },
    avgStake: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 }
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  stats: { type: StatsSchema, default: () => ({}) },
  openAiKey: { type: String, select: false, default: null },
  openAiKeySetAt: { type: Date, default: null }
});

export default mongoose.model('User', UserSchema);
