import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const run = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/targetrank');

    const password = 'Test@123';
    const hash = await bcrypt.hash(password, 12);

    // Check if mentor exists
    let mentor = await User.findOne({ email: 'mentor@targetrank.com' });
    if (mentor) {
      mentor.password = hash;
      await mentor.save();
      console.log('✅ mentor@targetrank.com password updated');
    } else {
      mentor = new User({
        name: 'Test Mentor',
        email: 'mentor@targetrank.com',
        password: hash,
        role: 'mentor',
        isActive: true,
      });
      await mentor.save();
      console.log('✅ mentor@targetrank.com created');
    }

    // Verify the hash works
    const found = await User.findOne({ email: 'mentor@targetrank.com' });
    const ok = await bcrypt.compare(password, found.password);
    console.log('Password verification:', ok ? 'PASS ✅' : 'FAIL ❌');
    console.log('Role:', found.role);

    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
};

run();
