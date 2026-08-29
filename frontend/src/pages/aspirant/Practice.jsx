import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiBookmark, FiAward, FiBookOpen, FiHelpCircle, FiClock, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import questionAPI from '../../api/questionApi.js';
import examAPI from '../../api/examApi.js';

const CATEGORIES = [
  'General Studies', 'General Knowledge', 'Current Affairs', 'Indian Polity',
  'History', 'Geography', 'Economy', 'Environment', 'Science and Technology',
  'Mathematics', 'Reasoning', 'English', 'Computer Awareness', 'Banking Awareness', 'State-specific GK'
];

export default function Practice() {
  // Filters list
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selected filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Questions and state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Interactive state per question
  const [answersSubmitted, setAnswersSubmitted] = useState({}); // { questionId: selectedOptionText }
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [score, setScore] = useState(0);
  const [totalAttempted, setTotalAttempted] = useState(0);

  // Fetch initial exams list and bookmarked IDs
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

  // Fetch subjects and topics when exam changes
  useEffect(() => {
    if (!selectedExamId) {
      setSubjects([]);
      setTopics([]);
      setSelectedSubjectId('');
      setSelectedTopicId('');
      return;
    }

    const fetchSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExamId);
        // syllabus has phases -> gather subjects from all phases
        let allSubjects = [];
        let allTopics = [];
        data.syllabus.forEach(phase => {
          phase.subjects.forEach(sub => {
            allSubjects.push(sub);
            sub.topics.forEach(top => {
              allTopics.push(top);
            });
          });
        });
        setSubjects(allSubjects);
        setTopics(allTopics);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSyllabus();
  }, [selectedExamId]);

  // Fetch questions matching filters
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        limit: 100, // Fetch up to 100 to practice
      };
      const { data } = await questionAPI.getQuestions(params);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswersSubmitted({});
      setScore(0);
      setTotalAttempted(0);
    } catch (err) {
      toast.error('Failed to load questions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedExamId, selectedSubjectId, selectedTopicId, selectedCategory, selectedDifficulty]);

  // Submit Answer
  const handleSelectOption = (question, option) => {
    const qid = question._id;
    if (answersSubmitted[qid]) return; // already answered

    const isCorrect = option === question.correctAnswer;
    setAnswersSubmitted(prev => ({ ...prev, [qid]: option }));
    setTotalAttempted(prev => prev + 1);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      toast.success('Correct Answer!', { icon: '🎉' });
    } else {
      toast.error('Incorrect Answer. Review the explanation.');
    }
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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBookOpen className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Self Practice Desk</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Adaptive GS/GK Practice</h1>
            <p className="text-slate-500 text-xs mt-0.5">Filter subjects, test topic accuracies, and bookmark tricky questions.</p>
          </div>

          {/* Practice Accuracy Score Card */}
          {questions.length > 0 && (
            <div className="glass-card px-4 py-2 bg-dark-900 border-slate-800 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <FiAward />
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-500 font-semibold leading-none">Accuracy Score</p>
                <p className="text-sm font-bold text-white mt-1">
                  {score}/{totalAttempted} <span className="text-xs text-slate-400 font-normal">({totalAttempted > 0 ? Math.round((score / totalAttempted) * 100) : 0}%)</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="glass-card p-5 bg-dark-900/40 border-slate-850 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Exam Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Exam Stream</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Exams</option>
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Topic</label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Topics</option>
              {topics.map(t => (
                <option key={t._id} value={t._id}>{t.title}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Questions Render Panel */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : questions.length === 0 ? (
          <div className="glass-card p-16 text-center border-slate-850">
            <FiHelpCircle className="text-4xl text-slate-600 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-2">No questions available</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              We couldn't find any questions matching the selected filter settings. Try adjusting your fields or search.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Card Info header */}
            <div className="flex justify-between items-center text-xs text-slate-500 px-1">
              <span>Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong></span>
              <span className="flex items-center gap-1"><FiClock /> {currentQuestion.marks} Marks</span>
            </div>

            {/* Main Question Card */}
            <div className="glass-card p-8 bg-dark-900 border-slate-800 relative space-y-6">
              {/* Top metadata tags */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                    {currentQuestion.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    currentQuestion.difficulty === 'hard' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {currentQuestion.difficulty.toUpperCase()}
                  </span>
                  {currentQuestion.year && (
                    <span className="text-[10px] font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-full">
                      PYQ {currentQuestion.year}
                    </span>
                  )}
                </div>

                {/* Bookmark Toggle Button */}
                <button
                  onClick={() => handleToggleBookmark(currentQuestion._id)}
                  className={`p-2 rounded-xl border transition-all ${
                    bookmarkedIds.includes(currentQuestion._id)
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-dark-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <FiBookmark className={bookmarkedIds.includes(currentQuestion._id) ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                {currentQuestion.questionText}
              </div>

              {/* Options choices */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, oidx) => {
                  const qid = currentQuestion._id;
                  const selectedOption = answersSubmitted[qid];
                  const isOptionSelected = selectedOption === option;
                  const isCorrectOption = option === currentQuestion.correctAnswer;
                  
                  // Style logic
                  let btnStyle = 'border-slate-800/80 bg-dark-950 hover:border-slate-700/80 hover:bg-dark-900';
                  let iconElement = null;

                  if (selectedOption) {
                    if (isCorrectOption) {
                      // Correct option always displays green
                      btnStyle = 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300';
                      iconElement = <FiCheck className="text-emerald-400 shrink-0 text-sm" />;
                    } else if (isOptionSelected) {
                      // Selected wrong option displays red
                      btnStyle = 'border-rose-500/40 bg-rose-500/5 text-rose-300';
                      iconElement = <FiX className="text-rose-400 shrink-0 text-sm" />;
                    } else {
                      // Unselected non-correct options dim down
                      btnStyle = 'border-slate-900 bg-dark-950/40 text-slate-600 cursor-not-allowed';
                    }
                  }

                  return (
                    <button
                      key={oidx}
                      disabled={!!selectedOption}
                      onClick={() => handleSelectOption(currentQuestion, option)}
                      className={`w-full text-left px-5 py-4 border rounded-xl flex items-center justify-between gap-3 text-xs transition-all ${btnStyle}`}
                    >
                      <span className="leading-relaxed">{option}</span>
                      {iconElement}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal Panel */}
              {answersSubmitted[currentQuestion._id] && (
                <div className="mt-6 pt-6 border-t border-slate-800/60 space-y-3 animate-pulse-slow">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Solution & Explanation</h4>
                  <div className="bg-dark-950 border border-slate-850/80 p-4.5 rounded-xl text-slate-400 text-xs leading-relaxed">
                    <p className="font-semibold text-emerald-400 mb-2">
                      Correct Answer: {currentQuestion.correctAnswer}
                    </p>
                    <p className="whitespace-pre-line">{currentQuestion.explanation || 'No detailed explanation provided for this question.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Prev/Next controls */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="btn-secondary py-2 px-4 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <FiChevronLeft /> Previous
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="btn-primary py-2 px-5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
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
