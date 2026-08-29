import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/targetrank';
    await mongoose.connect(mongoUri);

    let aspirant = await User.findOne({ email: 'aspirant@targetrank.com' });
    if (!aspirant) {
      aspirant = await User.create({
        name: 'Seed Aspirant',
        email: 'aspirant@targetrank.com',
        password: 'aspirant123',
        role: 'aspirant',
        active: true,
      });
      console.log('Default seed aspirant (aspirant@targetrank.com / aspirant123) created.');
    } else {
      console.log('Aspirant already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
