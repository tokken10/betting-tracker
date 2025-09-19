import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  openAiKey: { type: String, select: false, default: null },
  openAiKeySetAt: { type: Date, default: null }
});

export default mongoose.model('User', UserSchema);
