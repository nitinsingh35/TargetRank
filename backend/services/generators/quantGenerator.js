import { validateMCQ } from './validators.js';

export const generateQuantQuestions = (count = 10) => {
  const templates = [
    // Profit and Loss
    () => {
      const cp = Math.floor(Math.random() * 50) * 10 + 100; // 100 to 600
      const profitPct = Math.floor(Math.random() * 6) * 5 + 10; // 10% to 40%
      const discountPct = Math.floor(Math.random() * 3) * 5 + 5; // 5% to 15%

      // MP = CP * (100 + P) / (100 - D)
      const rawMP = (cp * (100 + profitPct)) / (100 - discountPct);
      const mp = Math.round(rawMP);
      const actualSp = Math.round(mp * (1 - discountPct / 100));
      const actualProfit = actualSp - cp;
      const actualGainPct = parseFloat(((actualProfit / cp) * 100).toFixed(2));

      const questionText = `A dealer marks his goods such that after giving a discount of ${discountPct}%, he makes a profit of ${profitPct}%. If the cost price of the goods is Rs. ${cp}, what is the marked price of the goods (rounded to the nearest integer)?`;
      
      const correctAnswer = `Rs. ${mp}`;
      const wrong1 = `Rs. ${mp + 25}`;
      const wrong2 = `Rs. ${mp - 30}`;
      const wrong3 = `Rs. ${mp + 40}`;

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `Let Marked Price be M.\nDiscount = ${discountPct}%. Selling Price (SP) = M * (100 - ${discountPct})/100 = 0.90 * M.\nProfit = ${profitPct}% on Cost Price (CP) Rs. ${cp}.\nSP = CP * (100 + Profit%)/100 = ${cp} * ${100 + profitPct}/100 = Rs. ${actualSp}.\nTherefore, M * (100 - ${discountPct})/100 = ${actualSp} => M = (${actualSp} * 100) / ${100 - discountPct} = Rs. ${mp}.`,
        difficulty: cp > 300 ? 'hard' : 'medium',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Profit and Loss', 'Aptitude'],
      };
    },

    // Time and Work
    () => {
      const daysA = Math.floor(Math.random() * 10) + 10; // 10 to 19 days
      const daysB = Math.floor(Math.random() * 15) + 15; // 15 to 29 days

      // Together time = (A*B) / (A+B)
      const together = parseFloat(((daysA * daysB) / (daysA + daysB)).toFixed(2));

      const questionText = `A can complete a certain piece of work in ${daysA} days, and B can complete the same work in ${daysB} days. In how many days can they complete the work together if they work simultaneously?`;
      
      const correctAnswer = `${together} days`;
      const wrong1 = `${parseFloat((together + 1.5).toFixed(2))} days`;
      const wrong2 = `${parseFloat((together - 0.8).toFixed(2))} days`;
      const wrong3 = `${parseFloat((together + 2.2).toFixed(2))} days`;

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `Work done by A in 1 day = 1/${daysA}\nWork done by B in 1 day = 1/${daysB}\nCombined 1-day work = 1/${daysA} + 1/${daysB} = (${daysA} + ${daysB})/(${daysA} * ${daysB}) = ${daysA + daysB}/${daysA * daysB}.\nNumber of days required = (${daysA * daysB}) / (${daysA + daysB}) = ${together} days.`,
        difficulty: together > 12 ? 'medium' : 'easy',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Time and Work', 'Quantitative Aptitude'],
      };
    },

    // Averages
    () => {
      const studentCount = Math.floor(Math.random() * 10) + 20; // 20 to 29 students
      const originalAvg = Math.floor(Math.random() * 10) + 40; // 40 to 49 kg
      const extraWeight = Math.floor(Math.random() * 5) + 50; // 50 to 54 kg (teacher weight)

      // New average = (studentCount * originalAvg + extraWeight) / (studentCount + 1)
      const totalWeight = studentCount * originalAvg + extraWeight;
      const newAvg = parseFloat((totalWeight / (studentCount + 1)).toFixed(2));

      const questionText = `The average weight of a class of ${studentCount} students is ${originalAvg} kg. When the weight of the class teacher is added, the average increases. If the weight of the teacher is ${extraWeight} kg, what is the new average weight of the class (in kg)?`;

      const correctAnswer = `${newAvg} kg`;
      const wrong1 = `${parseFloat((newAvg + 1.2).toFixed(2))} kg`;
      const wrong2 = `${parseFloat((newAvg - 1.8).toFixed(2))} kg`;
      const wrong3 = `${parseFloat((newAvg + 0.9).toFixed(2))} kg`;

      return {
        questionText,
        options: [correctAnswer, wrong1, wrong2, wrong3],
        correctAnswer,
        explanation: `Total weight of ${studentCount} students = ${studentCount} * ${originalAvg} = ${studentCount * originalAvg} kg.\nWeight of teacher = ${extraWeight} kg.\nNew total weight = ${studentCount * originalAvg} + ${extraWeight} = ${totalWeight} kg.\nTotal number of people = ${studentCount} + 1 = ${studentCount + 1}.\nNew average = ${totalWeight} / ${studentCount + 1} = ${newAvg} kg.`,
        difficulty: 'medium',
        marks: 2,
        negativeMarks: 0.5,
        tags: ['Averages', 'Aptitude'],
      };
    }
  ];

  const generated = [];
  for (let i = 0; i < count; i++) {
    const tmplIndex = i % templates.length;
    const item = templates[tmplIndex]();
    // Shuffle options before final return
    const shuffledOptions = [...item.options];
    for (let k = shuffledOptions.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [shuffledOptions[k], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[k]];
    }
    item.options = shuffledOptions;

    // Validate
    const err = validateMCQ(item);
    if (!err) generated.push(item);
  }

  return generated;
};
