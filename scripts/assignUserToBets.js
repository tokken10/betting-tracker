import mongoose from 'mongoose';
import connectDB from '../src/db.js';
import Bet from '../src/models/Bet.js';
import logger from '../src/utils/logger.js';

const userId = process.argv[2] || process.env.USER_ID;
if (!userId) {
  logger.error('Usage: node scripts/assignUserToBets.js <userId>');
  process.exit(1);
}

(async () => {
  try {
    await connectDB();
    const result = await Bet.updateMany(
      { user: { $exists: false } },
      { $set: { user: userId } }
    );
    logger.info(`Updated ${result.modifiedCount} bets`);
  } catch (err) {
    logger.error(err);
  } finally {
    await mongoose.disconnect();
  }
})();
