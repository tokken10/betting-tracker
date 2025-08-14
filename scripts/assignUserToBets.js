import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../src/db.js';
import Bet from '../src/models/Bet.js';

const userId = process.argv[2] || process.env.USER_ID;
if (!userId) {
  console.error('Usage: node scripts/assignUserToBets.js <userId>');
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
    const result = await Bet.updateMany(
      { user: { $exists: false } },
      { $set: { user: userId } }
    );
    console.log(`Updated ${result.modifiedCount} bets`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
