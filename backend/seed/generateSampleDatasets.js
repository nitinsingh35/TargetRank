import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generatePolity100 = () => {
  const list = [];
  for (let i = 1; i <= 100; i++) {
    const article = 12 + (i % 40); // Articles 12 to 51
    list.push({
      category: 'Indian Polity',
      questionText: `Which of the following is correct regarding Article ${article} of the Constitution of India (Practice Question #${i})?`,
      options: [
        `Defines provision for fundamental rights or duties matching Article ${article}`,
        `Abolished by the 44th Constitutional Amendment`,
        `Subject to joint session directives only`,
        `Suspended during financial emergency automatically`
      ],
      correctAnswer: `Defines provision for fundamental rights or duties matching Article ${article}`,
      explanation: `Article ${article} is part of the Fundamental Rights/DPSP listed under the Constitution. Practice explanation #${i}.`,
      difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
      marks: 2,
      negativeMarks: 0.66,
      tags: ['Polity', 'Constitutional Articles', `Article ${article}`],
      language: 'english',
      sourceType: 'practice_generated',
      sourceName: 'TargetRank Polity Bank',
      year: 2020 + (i % 5)
    });
  }
  return list;
};

const generateQuant100 = () => {
  const list = [];
  for (let i = 1; i <= 100; i++) {
    const cp = 100 + i * 5;
    const profitPct = 10 + (i % 5) * 5;
    const discountPct = 5 + (i % 3) * 5;
    const mp = Math.round((cp * (100 + profitPct)) / (100 - discountPct));
    
    list.push({
      category: 'Mathematics',
      questionText: `A dealer marks his goods such that after giving a discount of ${discountPct}%, he makes a profit of ${profitPct}%. If the cost price of the goods is Rs. ${cp}, what is the marked price (Practice Question #${i})?`,
      options: [`Rs. ${mp}`, `Rs. ${mp + 20}`, `Rs. ${mp - 15}`, `Rs. ${mp + 35}`],
      correctAnswer: `Rs. ${mp}`,
      explanation: `Marked Price (MP) calculation: CP = ${cp}, Profit = ${profitPct}%, Discount = ${discountPct}%. MP = CP * (100 + P) / (100 - D) = Rs. ${mp}.`,
      difficulty: i % 2 === 0 ? 'medium' : 'hard',
      marks: 2,
      negativeMarks: 0.5,
      tags: ['Profit and Loss', 'Quant', 'SSC CGL'],
      language: 'english',
      sourceType: 'practice_generated',
      sourceName: 'TargetRank Quant Bank',
      year: 2022
    });
  }
  return list;
};

const generateReasoning100 = () => {
  const list = [];
  for (let i = 1; i <= 100; i++) {
    const start = 10 + i;
    const step = 2 + (i % 4);
    const series = [start, start + step, start + 2 * step, start + 3 * step];
    const nextVal = start + 4 * step;

    list.push({
      category: 'Reasoning',
      questionText: `Find the next number in this arithmetic sequence: ${series.join(', ')}, ... (Practice Question #${i})?`,
      options: [`${nextVal}`, `${nextVal + step}`, `${nextVal - 2}`, `${nextVal * 2}`],
      correctAnswer: `${nextVal}`,
      explanation: `The common difference in this sequence is ${step}.\nNext term is ${series[3]} + ${step} = ${nextVal}.`,
      difficulty: 'easy',
      marks: 2,
      negativeMarks: 0.5,
      tags: ['Number Series', 'Logical Reasoning', 'Banking PO'],
      language: 'english',
      sourceType: 'practice_generated',
      sourceName: 'TargetRank Reasoning Bank',
      year: 2023
    });
  }
  return list;
};

const run = () => {
  const sampleDataDir = path.join(__dirname, 'sample-data');
  ensureDir(sampleDataDir);

  console.log('Generating UPSC Polity 100 JSON...');
  fs.writeFileSync(
    path.join(sampleDataDir, 'upsc-polity-100.json'),
    JSON.stringify(generatePolity100(), null, 2)
  );

  console.log('Generating SSC Quant 100 JSON...');
  fs.writeFileSync(
    path.join(sampleDataDir, 'ssc-quant-100.json'),
    JSON.stringify(generateQuant100(), null, 2)
  );

  console.log('Generating Banking Reasoning 100 JSON...');
  fs.writeFileSync(
    path.join(sampleDataDir, 'banking-reasoning-100.json'),
    JSON.stringify(generateReasoning100(), null, 2)
  );

  console.log('Datasets successfully written to backend/seed/sample-data/');
};

run();
