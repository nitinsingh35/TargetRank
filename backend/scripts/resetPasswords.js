import mongoose from 'mongoose';
import User from '../models/User.js';

const run = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/targetrank');

    const plainPassword = 'Test@123';

    // --- Fix ADMIN ---
    const admin = await User.findOne({ email: 'admin@targetrank.com' });
    if (admin) {
      admin.password = plainPassword; // pre-save hook will hash this
      await admin.save();
      console.log('✅ admin@targetrank.com password set');
    }

    // --- Fix / Create MENTOR ---
    let mentor = await User.findOne({ email: 'mentor@targetrank.com' });
    if (mentor) {
      mentor.password = plainPassword;
      await mentor.save();
      console.log('✅ mentor@targetrank.com password updated');
    } else {
      await User.create({
        name: 'Test Mentor',
        email: 'mentor@targetrank.com',
        password: plainPassword, // pre-save hook will hash
        role: 'mentor',
        active: true,
      });
      console.log('✅ mentor@targetrank.com created');
    }

    // --- Fix existing mentor (x@gmail.com) ---
    const mentor2 = await User.findOne({ email: 'x@gmail.com' });
    if (mentor2) {
      mentor2.password = plainPassword;
      await mentor2.save();
      console.log('✅ x@gmail.com (mentor) password updated');
    }

    // --- Fix ASPIRANT ---
    const aspirant = await User.findOne({ email: 'aspirant@targetrank.com' });
    if (aspirant) {
      aspirant.password = plainPassword;
      await aspirant.save();
      console.log('✅ aspirant@targetrank.com password set');
    }

    // --- Fix nitin ---
    const nitin = await User.findOne({ email: 'nitin@gmail.com' });
    if (nitin) {
      nitin.password = plainPassword;
      await nitin.save();
      console.log('✅ nitin@gmail.com password set');
    }

    console.log('\n========================================');
    console.log('  LOGIN CREDENTIALS (all use Test@123)');
    console.log('========================================');
    console.log('  ADMIN:    admin@targetrank.com');
    console.log('  MENTOR:   mentor@targetrank.com');
    console.log('  ASPIRANT: aspirant@targetrank.com');
    console.log('  ASPIRANT: nitin@gmail.com');
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
};

run();
