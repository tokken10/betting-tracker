const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { updateUserStats } = require('../utils/userStats');
const logger = require('../utils/logger');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find();
    for (const user of users) {
      await updateUserStats(user._id);
      logger.info(`Updated stats for ${user.username}`);
    }
  } catch (err) {
    logger.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
