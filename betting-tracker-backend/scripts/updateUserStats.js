const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { updateUserStats } = require('../utils/userStats');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find();
    for (const user of users) {
      await updateUserStats(user._id);
      console.log(`Updated stats for ${user.username}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
