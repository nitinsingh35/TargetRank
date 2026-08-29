import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiAward, FiSettings, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import questionAPI from '../../api/questionApi.js';

const CATEGORIES = [
  'General Studies', 'General Knowledge', 'Current Affairs', 'Indian Polity',
  'History', 'Geography', 'Economy', 'Environment', 'Science and Technology',
  'Mathematics', 'Reasoning', 'English', 'Computer Awareness', 'Banking Awareness', 'State-specific GK'
];

export default function CreateQuestion() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [category, setCategory] = useState('General Studies');
  const [difficulty, setDifficulty] = useState('medium');
  const [marks, setMarks] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0.66);
  const [year, setYear] = useState('');
  const [source, setSource] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');

  // 4 Option states
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctKey, setCorrectKey] = useState('A'); // 'A' | 'B' | 'C' | 'D'

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) return toast.error('Question text is required.');
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      return toast.error('All 4 options are required.');
    }

    const options = [optA.trim(), optB.trim(), optC.trim(), optD.trim()];
    let correctAnswer = '';
    if (correctKey === 'A') correctAnswer = optA.trim();
    if (correctKey === 'B') correctAnswer = optB.trim();
    if (correctKey === 'C') correctAnswer = optC.trim();
    if (correctKey === 'D') correctAnswer = optD.trim();

    const payload = {
      category,
      difficulty,
      marks: Number(marks) || 2,
      negativeMarks: Number(negativeMarks) || 0,
      year: year ? Number(year) : null,
      source: source.trim() || null,
      questionText: questionText.trim(),
      options,
      correctAnswer,
      explanation: explanation.trim(),
    };

    setSubmitting(true);
    try {
      await questionAPI.createQuestion(payload);
      toast.success('Question authored successfully.');
      navigate('/mentor/questions');
    } catch (err) {
      toast.error('Failed to create question.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Back link */}
        <Link
          to="/mentor/questions"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Questions list
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Create Practice Question</h1>
          <p className="text-slate-500 text-xs mt-0.5">Author a new question. Mentors' submissions will be sent to the admin moderation queue.</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 bg-dark-900 border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Meta row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Correct key dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Correct Answer Option</label>
                <select
                  value={correctKey}
                  onChange={(e) => setCorrectKey(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>

            {/* Meta row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              {/* Marks */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Marks</label>
                <input
                  type="number"
                  step="0.01"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              {/* Neg Marks */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Negative Marks</label>
                <input
                  type="number"
                  step="0.01"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exam Year <span className="text-slate-600 normal-case">(optional)</span></label>
                <input
                  type="number"
                  placeholder="e.g. 2022"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Paper Source <span className="text-slate-600 normal-case">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. UPSC Prelims GS"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Question Text</label>
              <textarea
                rows="4"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type the full question text here..."
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* MCQ Options list */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-850">MCQ Options (Provide all 4)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Opt A */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Option A</label>
                  <input
                    type="text"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="Enter Option A content"
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                {/* Opt B */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Option B</label>
                  <input
                    type="text"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="Enter Option B content"
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                {/* Opt C */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Option C</label>
                  <input
                    type="text"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="Enter Option C content"
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                {/* Opt D */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Option D</label>
                  <input
                    type="text"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="Enter Option D content"
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Solution Explanation</label>
              <textarea
                rows="3"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Optional standard solution explanation..."
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-xs focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-850">
              <Link
                to="/mentor/questions"
                className="bg-dark-800 hover:bg-dark-750 text-slate-400 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-1.5"
              >
                <FiSave /> {submitting ? 'Submitting...' : 'Save Question'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
