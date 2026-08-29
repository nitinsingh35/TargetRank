import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiBookmark, FiSearch, FiCalendar, FiClock, FiHelpCircle, FiChevronLeft, FiChevronRight, FiCheck, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import questionAPI from '../../api/questionApi.js';
import examAPI from '../../api/examApi.js';

export default function PreviousYearQuestions() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stats
  const [answersSubmitted, setAnswersSubmitted] = useState({});
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // Fetch initial data
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const examRes = await examAPI.getExams();
        setExams(examRes.data);
        
        const bookmarkRes = await questionAPI.getBookmarks();
        setBookmarkedIds(bookmarkRes.data.map(b => b._id));
      } catch (err) {
        console.error(err);
      }
    };
    bootstrap();
  }, []);

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      const params = {
        examId: selectedExamId,
        year: selectedYear || undefined,
        search: searchTerm || undefined,
        isPYQ: 'true', // Filter strictly by questions with years
        limit: 100,
      };
      const { data } = await questionAPI.getQuestions(params);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswersSubmitted({});
    } catch (err) {
      toast.error('Failed to load previous-year questions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPYQs();
  }, [selectedExamId, selectedYear, searchTerm]);

  // Submit Answer
  const handleSelectOption = (question, option) => {
    const qid = question._id;
    if (answersSubmitted[qid]) return; // already answered
    setAnswersSubmitted(prev => ({ ...prev, [qid]: option }));
  };

  // Toggle Bookmark
  const handleToggleBookmark = async (qid) => {
    try {
      const { data } = await questionAPI.toggleBookmark(qid);
      if (data.bookmarked) {
        setBookmarkedIds(prev => [...prev, qid]);
        toast.success('Question bookmarked!');
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== qid));
        toast.success('Bookmark removed.');
      }
    } catch (err) {
      toast.error('Failed to update bookmark.');
    }
  };

  // Years array
  const yearsList = [2023, 2022, 2021, 2020, 2019, 2018];

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiCalendar className="text-accent-400" />
            <span className="text-xs font-semibold text-accent-400 uppercase tracking-widest">Archive Vault</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Previous-Year Questions (PYQs)</h1>
          <p className="text-slate-500 text-xs mt-0.5">Practice original questions sourced directly from past official papers.</p>
        </div>

        {/* Filter / Search Bar */}
        <div className="glass-card p-5 bg-dark-900/40 border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          {/* Search keyword */}
          <div className="md:col-span-5 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm" />
            <input
              type="text"
              placeholder="Search keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-300 text-xs focus:outline-none"
            />
          </div>

          {/* Exam Filter */}
          <div className="md:col-span-4">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Exams</option>
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Years</option>
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Question Panel */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="glass-card p-16 text-center border-slate-850">
            <FiHelpCircle className="text-4xl text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-2">No PYQ questions found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              No historical questions are available matching these filters. Try modifying your search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header info */}
            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong></span>
              <span className="bg-accent-500/10 border border-accent-500/20 text-accent-400 px-2 py-0.5 rounded-full font-bold">
                {questions[currentIndex].source} ({questions[currentIndex].year})
              </span>
            </div>

            {/* Main Question Card */}
            <div className="glass-card p-8 bg-dark-900 border-slate-800 relative space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                  {questions[currentIndex].category}
                </span>

                <button
                  onClick={() => handleToggleBookmark(questions[currentIndex]._id)}
                  className={`p-2 rounded-xl border transition-all ${
                    bookmarkedIds.includes(questions[currentIndex]._id)
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-dark-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <FiBookmark className={bookmarkedIds.includes(questions[currentIndex]._id) ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                {questions[currentIndex].questionText}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {questions[currentIndex].options.map((option, oidx) => {
                  const q = questions[currentIndex];
                  const selectedOption = answersSubmitted[q._id];
                  const isOptionSelected = selectedOption === option;
                  const isCorrectOption = option === q.correctAnswer;
                  
                  let btnStyle = 'border-slate-800 bg-dark-950 hover:border-slate-750 hover:bg-dark-900';
                  let iconElement = null;

                  if (selectedOption) {
                    if (isCorrectOption) {
                      btnStyle = 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300';
                      iconElement = <FiCheck className="text-emerald-400 text-sm" />;
                    } else if (isOptionSelected) {
                      btnStyle = 'border-rose-500/40 bg-rose-500/5 text-rose-300';
                      iconElement = <FiX className="text-rose-400 text-sm" />;
                    } else {
                      btnStyle = 'border-slate-900 bg-dark-950/40 text-slate-600 cursor-not-allowed';
                    }
                  }

                  return (
                    <button
                      key={oidx}
                      disabled={!!selectedOption}
                      onClick={() => handleSelectOption(q, option)}
                      className={`w-full text-left px-5 py-4 border rounded-xl flex items-center justify-between gap-3 text-xs transition-all ${btnStyle}`}
                    >
                      <span>{option}</span>
                      {iconElement}
                    </button>
                  );
                })}
              </div>

              {/* Explanation panel */}
              {answersSubmitted[questions[currentIndex]._id] && (
                <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Solution & Explanation</h4>
                  <div className="bg-dark-950 border border-slate-850 p-4.5 rounded-xl text-slate-400 text-xs leading-relaxed">
                    <p className="font-semibold text-emerald-400 mb-2">
                      Correct Answer: {questions[currentIndex].correctAnswer}
                    </p>
                    <p className="whitespace-pre-line">{questions[currentIndex].explanation || 'No explanation available.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCurrentIndex(prev => prev - 1)}
                disabled={currentIndex === 0}
                className="btn-secondary py-2 px-4 text-xs font-semibold disabled:opacity-40"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={() => setCurrentIndex(prev => prev + 1)}
                disabled={currentIndex === questions.length - 1}
                className="btn-primary py-2 px-5 text-xs font-semibold disabled:opacity-40"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
