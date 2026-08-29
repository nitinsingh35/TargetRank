import mongoose from 'mongoose';
import Question from '../models/Question.js';

await mongoose.connect('mongodb://localhost:27017/targetrank');
const total = await Question.countDocuments({});
const published = await Question.countDocuments({ qualityStatus: 'published' });
const draft = await Question.countDocuments({ qualityStatus: 'draft' });
const pyq = await Question.countDocuments({ isPreviousYearQuestion: true });
const types = await Question.distinct('questionType');
console.log('✅ DB Verification Results:');
console.log('  Total Questions:', total);
console.log('  Published:', published);
console.log('  Draft:', draft);
console.log('  PYQ:', pyq);
console.log('  Types in DB:', types.join(', '));
await mongoose.disconnect();
