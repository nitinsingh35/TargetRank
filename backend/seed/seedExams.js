import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Exam from '../models/Exam.js';
import ExamPhase from '../models/ExamPhase.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import User from '../models/User.js';
import { examSeedData } from './examSeedData.js';

dotenv.config();

const seedExams = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting exam syllabus seed...\n');

    // Find or note admin user for createdBy
    const admin = await User.findOne({ role: 'admin' });
    const createdBy = admin?._id || null;

    // Clear existing exam data
    await Promise.all([
      Topic.deleteMany({}),
      Subject.deleteMany({}),
      ExamPhase.deleteMany({}),
      Exam.deleteMany({}),
    ]);
    console.log('✓ Cleared existing exam data\n');

    for (const examData of examSeedData) {
      const { phases, ...examFields } = examData;

      const exam = await Exam.create({
        ...examFields,
        createdBy,
        active: true,
      });
      console.log(`📚 Created exam: ${exam.title}`);

      for (const phaseData of phases) {
        const { subjects, ...phaseFields } = phaseData;

        const examPhase = await ExamPhase.create({
          examId: exam._id,
          ...phaseFields,
          active: true,
        });
        console.log(`   └─ Phase: ${examPhase.title}`);

        for (const subjectData of subjects) {
          const { topics, ...subjectFields } = subjectData;

          const subject = await Subject.create({
            examId: exam._id,
            phaseId: examPhase._id,
            ...subjectFields,
            active: true,
          });

          for (let i = 0; i < topics.length; i++) {
            const topicData = topics[i];
            await Topic.create({
              examId: exam._id,
              phaseId: examPhase._id,
              subjectId: subject._id,
              ...topicData,
              order: i + 1,
              active: true,
            });
          }
          console.log(`      └─ Subject: ${subject.title} (${topics.length} topics)`);
        }
      }
      console.log('');
    }

    const counts = {
      exams: await Exam.countDocuments(),
      phases: await ExamPhase.countDocuments(),
      subjects: await Subject.countDocuments(),
      topics: await Topic.countDocuments(),
    };

    console.log('✅ Seed completed successfully!');
    console.log(`   Exams: ${counts.exams} | Phases: ${counts.phases} | Subjects: ${counts.subjects} | Topics: ${counts.topics}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seedExams();
