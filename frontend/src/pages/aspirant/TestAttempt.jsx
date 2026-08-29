import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiCheckSquare, FiAlertCircle, FiChevronLeft, FiChevronRight, FiList, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';

export default function TestAttempt() {
  const { id: testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Load params from state passed by TestInstructions
  const { attemptId, questions = [], durationMinutes = 60 } = location.state || {};

  // Redirect if directly accessed without state parameters
  useEffect(() => {
    if (!attemptId || questions.length === 0) {
      toast.error('Session parameters missing. Start through the catalog.');
      navigate('/aspirant/mock-tests');
    }
  }, [attemptId, questions, navigate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qid]: optionText }
  const [markedForReview, setMarkedForReview] = useState([]); // [qid, qid]
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);

  // Use ref to keep track of answers for background auto-saves
  const answersRef = useRef(answers);
  const reviewRef = useRef(markedForReview);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    reviewRef.current = markedForReview;
  }, [markedForReview]);

  // 1. Digital Clock Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 2. Background Auto-save API helper
  const triggerAutoSave = async () => {
    if (!attemptId) return;
    try {
      await testAPI.saveAttemptProgress(attemptId, {
        answers: answersRef.current,
        markedForReview: reviewRef.current
      });
    } catch (err) {
      console.warn('Background auto-save failed:', err);
    }
  };

  // Format digital countdown clock: MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // 3. Option Action controls
  const handleSelectOption = (qid, optionText) => {
    setAnswers(prev => {
      const updated = { ...prev, [qid]: optionText };
      // Save progress in background
      setTimeout(triggerAutoSave, 50);
      return updated;
    });
  };

  const handleClearAnswer = (qid) => {
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[qid];
      setTimeout(triggerAutoSave, 50);
      return updated;
    });
  };

  const handleToggleReview = (qid) => {
    setMarkedForReview(prev => {
      const updated = prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid];
      setTimeout(triggerAutoSave, 50);
      return updated;
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      triggerAutoSave();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      triggerAutoSave();
    }
  };

  // 4. Auto-submit on timer expiry
  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.loading('Timer expired. Auto-submitting responses...', { id: 'submit-exam-toast' });
    try {
      await testAPI.submitAttempt(attemptId);
      toast.success('Exam submitted successfully.', { id: 'submit-exam-toast' });
      navigate(`/aspirant/mock-tests/${attemptId}/result`);
    } catch (err) {
      toast.error('Failed to auto-submit attempt.', { id: 'submit-exam-toast' });
    }
  };

  // 5. Manual submit
  const handleManualSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit your test paper? Responses cannot be edited after submission.')) {
      return;
    }

    setSubmitting(true);
    toast.loading('Submitting test answers...', { id: 'submit-exam-toast' });
    try {
      await testAPI.submitAttempt(attemptId);
      toast.success('Test submitted successfully.', { id: 'submit-exam-toast' });
      navigate(`/aspirant/mock-tests/${attemptId}/result`);
    } catch (err) {
      toast.error('Failed to submit test.', { id: 'submit-exam-toast' });
      setSubmitting(false);
    }
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const qIdStr = currentQ?._id;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* Timer Bar */}
      <div className="bg-dark-900 border-b border-slate-900 sticky top-[72px] z-40 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 font-bold text-white truncate max-w-sm sm:max-w-md">
            <FiCheckSquare className="text-brand-400 shrink-0" />
            <span className="truncate">{location.state?.title || 'Mock Test Series'}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 font-extrabold ${
              timeLeft < 120 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' : 'bg-dark-950 border-slate-800 text-slate-300'
            }`}>
              <FiClock /> {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md text-[11px]"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Left Exam Paper Pane */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 bg-dark-900 border-slate-850 space-y-6 min-h-[400px] flex flex-col justify-between">
            {/* Question Heading metadata */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-semibold">{currentQ.marks} Marks</span>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-semibold text-slate-200 leading-relaxed whitespace-pre-line border-b border-slate-900 pb-5">
                {currentQ.questionText}
              </div>

              {/* MCQ Options list choices */}
              <div className="space-y-3 pt-3">
                {currentQ.options.map((option, oidx) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isSelected = answers[qIdStr] === option;
                  return (
                    <button
                      key={oidx}
                      onClick={() => handleSelectOption(qIdStr, option)}
                      className={`w-full text-left px-5 py-4 border rounded-xl flex items-center gap-4 text-xs transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500/5 text-brand-300'
                          : 'border-slate-850 bg-dark-950/40 hover:border-slate-700/80 text-slate-400'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        isSelected ? 'bg-brand-500 text-white' : 'bg-dark-800 text-slate-500'
                      }`}>
                        {letters[oidx]}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom action controls */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-900 flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
                >
                  <FiChevronLeft className="inline mr-1" /> Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === questions.length - 1}
                  className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
                >
                  Next <FiChevronRight className="inline ml-1" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleClearAnswer(qIdStr)}
                  disabled={!answers[qIdStr]}
                  className="bg-dark-950 hover:bg-dark-800 border border-slate-800 text-slate-500 hover:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => handleToggleReview(qIdStr)}
                  className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
                    markedForReview.includes(qIdStr)
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-dark-950 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {markedForReview.includes(qIdStr) ? 'Marked for Review' : 'Mark for Review'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Question Palette Pane */}
        <div className="space-y-6">
          <div className="glass-card p-6 bg-dark-900 border-slate-850 space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
              <FiList className="text-brand-400" /> Question Palette
            </h3>

            {/* Grid numbers */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const qid = q._id;
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[qid];
                const isMarked = markedForReview.includes(qid);

                let badgeStyle = 'bg-dark-950 border-slate-850 text-slate-500 hover:border-slate-600';
                if (isAnswered) {
                  badgeStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25';
                } else if (isMarked) {
                  badgeStyle = 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/25';
                }

                if (isCurrent) {
                  badgeStyle += ' ring-2 ring-brand-500 ring-offset-2 ring-offset-dark-900';
                }

                return (
                  <button
                    key={qid}
                    onClick={() => { setCurrentIndex(idx); triggerAutoSave(); }}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${badgeStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Color indicators helper */}
            <div className="grid grid-cols-2 gap-3.5 pt-4 border-t border-slate-850 text-[10px] font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 block"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-500/10 border border-purple-500/30 block"></span>
                <span>For Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-dark-950 border border-slate-850 block"></span>
                <span>Unattempted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md border-brand-500 border-2 block"></span>
                <span>Current Q</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
