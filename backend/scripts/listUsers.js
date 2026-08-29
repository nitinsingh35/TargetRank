import mongoose from 'mongoose';
import User from '../models/User.js';

const run = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/targetrank');
    const users = await User.find({}, 'name email role isActive createdAt').lean();
    console.log('=== EXISTING USERS ===');
    console.log(JSON.stringify(users, null, 2));
    console.log(`Total: ${users.length} users`);
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
};

run();
