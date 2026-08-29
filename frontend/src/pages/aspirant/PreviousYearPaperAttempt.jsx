import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiClock, FiCheckSquare, FiSave, FiAlertCircle, FiLoader,
  FiChevronLeft, FiChevronRight, FiCheck, FiX, FiBookmark,
  FiGrid, FiMenu
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import previousYearPaperAPI from '../../api/previousYearPaperApi.js';

export default function PreviousYearPaperAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // Core attempt and questions states
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Timer states
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
  const autoSubmitRef = useRef(false);

  // Response status indicator
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Mobile layout side-panel trigger
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Debouncing answer saving states
  const pendingSaveTimeoutRef = useRef(null);

  // 1. Fetch attempt and questions layout on resume
  const loadAttempt = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await previousYearPaperAPI.getAttemptDetails(attemptId);
      if (data.success) {
        if (data.expired) {
          // If already expired, redirect to result
          navigate(`/aspirant/previous-year-papers/attempt/${attemptId}/result`);
          return;
        }

        setAttempt(data.attempt);
        setQuestions(data.questions || []);
        setCurrentIndex(data.attempt.currentQuestionIndex || 0);
        setTimeLeft(data.remainingSeconds);
        
        // Start countdown
        startCountdown(data.remainingSeconds);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to resume paper session.');
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    loadAttempt();
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(pendingSaveTimeoutRef.current);
    };
  }, [loadAttempt]);

  // 2. Countdown tick logic
  const startCountdown = (initialSecs) => {
    clearInterval(timerRef.current);
    const endTime = Date.now() + initialSecs * 1000;

    timerRef.current = setInterval(async () => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (!autoSubmitRef.current) {
          autoSubmitRef.current = true;
          await handleAutoSubmit();
        }
      }
    }, 500);
  };

  // 3. API Action: Save answer
  const saveAnswerToDB = async (qId, selectedAns, marked, index, timeSpent = 5) => {
    setSaveStatus('saving');
    try {
      await previousYearPaperAPI.saveAnswer(attemptId, {
        questionId: qId,
        selectedAnswer: selectedAns === '' ? null : selectedAns,
        isMarkedForReview: !!marked,
        timeSpentSeconds: timeSpent,
        currentQuestionIndex: index,
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save answer response', err);
      setSaveStatus('error');
      toast.error('Response failed to save. Retrying automatically...', { id: 'save-fail' });
    }
  };

  // Debounced wrapper to save response dynamically
  const handleAnswerSelect = (ansOption) => {
    if (!attempt) return;

    // Local state change for rapid fluid selection feedback
    const updatedAnswers = [...attempt.answers];
    const ansIdx = updatedAnswers.findIndex(a => a.questionId === currentQuestion._id);
    
    if (ansIdx !== -1) {
      updatedAnswers[ansIdx].selectedAnswer = ansOption;
      updatedAnswers[ansIdx].visited = true;
    }
    setAttempt(prev => ({ ...prev, answers: updatedAnswers }));

    // Clear previous save timers
    clearTimeout(pendingSaveTimeoutRef.current);
    setSaveStatus('saving');

    pendingSaveTimeoutRef.current = setTimeout(() => {
      saveAnswerToDB(
        currentQuestion._id,
        ansOption,
        ansItem?.isMarkedForReview || false,
        currentIndex
      );
    }, 800);
  };

  // Clear current response selection
  const handleClearResponse = () => {
    handleAnswerSelect(null);
  };

  // Toggle Mark for Review flag status
  const handleToggleReview = async () => {
    if (!attempt || !currentQuestion) return;

    const updatedAnswers = [...attempt.answers];
    const ansIdx = updatedAnswers.findIndex(a => a.questionId === currentQuestion._id);
    let newMarkedVal = false;

    if (ansIdx !== -1) {
      newMarkedVal = !updatedAnswers[ansIdx].isMarkedForReview;
      updatedAnswers[ansIdx].isMarkedForReview = newMarkedVal;
      updatedAnswers[ansIdx].visited = true;
    }
    setAttempt(prev => ({ ...prev, answers: updatedAnswers }));

    // Send immediately to DB
    setSaveStatus('saving');
    try {
      await previousYearPaperAPI.markReview(attemptId, {
        questionId: currentQuestion._id,
        isMarkedForReview: newMarkedVal,
      });
      setSaveStatus('saved');
      toast.success(newMarkedVal ? 'Marked for review.' : 'Unmarked from review.', { id: 'review-toggle' });
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      
      // Update visited status of the next question locally
      const updatedAnswers = [...attempt.answers];
      const nextQId = questions[nextIdx]._id;
      const ansIdx = updatedAnswers.findIndex(a => a.questionId === nextQId);
      if (ansIdx !== -1 && !updatedAnswers[ansIdx].visited) {
        updatedAnswers[ansIdx].visited = true;
        // Save visit to DB
        saveAnswerToDB(nextQId, updatedAnswers[ansIdx].selectedAnswer, updatedAnswers[ansIdx].isMarkedForReview, nextIdx);
      }
      
      setAttempt(prev => ({ ...prev, answers: updatedAnswers }));
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Manual Submission handler
  const handleManualSubmit = async () => {
    setSubmitting(true);
    const toastId = toast.loading('Calculating exam report scorecard...');
    try {
      const { data } = await previousYearPaperAPI.submitAttempt(attemptId);
      if (data.success) {
        clearInterval(timerRef.current);
        toast.success('Exam attempt submitted successfully!', { id: toastId });
        setShowSubmitModal(false);
        navigate(`/aspirant/previous-year-papers/attempt/${attemptId}/result`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Submission failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Auto Submission handler on timer expiration
  const handleAutoSubmit = async () => {
    setSubmitting(true);
    toast.error('Time is up! Submitting paper attempt automatically...', { duration: 6000 });
    try {
      const { data } = await previousYearPaperAPI.autoSubmitAttempt(attemptId);
      if (data.success) {
        navigate(`/aspirant/previous-year-papers/attempt/${attemptId}/result`);
      }
    } catch (err) {
      console.error(err);
      // Hard redirect as fallback
      navigate(`/aspirant/previous-year-papers/attempt/${attemptId}/result`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format countdown remaining seconds
  const formatTime = (totalSecs) => {
    if (totalSecs === null) return '00:00:00';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Resuming exam session...</p>
        </div>
      </div>
    );
  }

  if (error || !attempt || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Session Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not fetch attempt.'}</p>
          </div>
          <button
            onClick={() => navigate('/aspirant/previous-year-papers')}
            className="btn-primary text-xs px-4 py-2 mx-auto justify-center"
          >
            Back to PYQ Library
          </button>
        </div>
      </div>
    );
  }

  // Derived details
  const currentQuestion = questions[currentIndex];
  const ansItem = attempt.answers?.find(a => a.questionId === currentQuestion?._id) || {};

  // Compute counts for palette dashboard
  const answeredCount   = attempt.answers?.filter(a => a.selectedAnswer !== null).length || 0;
  const markedCount     = attempt.answers?.filter(a => a.isMarkedForReview).length || 0;
  const unansweredCount = attempt.answers?.filter(a => a.selectedAnswer === null && a.visited).length || 0;
  const notVisitedCount = attempt.answers?.filter(a => !a.visited).length || 0;

  // Timer alert highlights
  const timerWarning = timeLeft !== null && timeLeft < 300; // < 5 min
  const timerDanger  = timeLeft !== null && timeLeft < 120; // < 2 min

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col text-slate-100 relative overflow-hidden">
      
      {/* Header Bar */}
      <header className="bg-dark-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3.5 flex-wrap">
          
          {/* Logo / Metadata */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-black text-white shrink-0">
              Target<span className="text-brand-400">Rank</span>
            </h1>
            <span className="w-px h-5 bg-slate-800 hidden sm:block shrink-0" />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-extrabold text-slate-200 truncate">{attempt.paperId?.title || 'PYQ Simulated Test'}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Exam Mode: Offline PYQ Simulator</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Save pill */}
            <div className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-lg border ${
              saveStatus === 'saving'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : saveStatus === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-dark-950 border-slate-800 text-emerald-400'
            }`}>
              {saveStatus === 'saving' ? (
                <><FiLoader className="animate-spin" /><span>Saving…</span></>
              ) : saveStatus === 'error' ? (
                <><FiAlertCircle /><span>Unsaved</span></>
              ) : (
                <><FiSave /><span>Saved</span></>
              )}
            </div>

            {/* Countdown Clock */}
            <div className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-lg border transition-all ${
              timerDanger
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse'
                : timerWarning
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-dark-950 border-slate-800 text-slate-350'
            }`}>
              <FiClock /><span>{formatTime(timeLeft)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="btn-primary py-2 px-3 sm:px-4 text-xs font-bold shadow-md shadow-brand-500/20"
            >
              <FiCheckSquare className="hidden sm:inline" />
              <span>Submit Paper</span>
            </button>

            {/* Palette toggle */}
            <button
              onClick={() => setIsPaletteOpen(p => !p)}
              className="md:hidden p-2 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-white"
            >
              <FiMenu className="text-sm" />
            </button>

          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col md:flex-row gap-6 relative z-10">
        
        {/* Left Side: Question workspace */}
        <div className="flex-1 space-y-4">
          
          {/* Question Card */}
          <div className="glass-card bg-dark-900/40 border-slate-800 p-6 sm:p-8 space-y-5">
            
            {/* Metadata headers */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-850 flex-wrap gap-2.5">
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">
                  Q. {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-slate-350 bg-slate-850 px-2 py-0.5 rounded">
                  +{currentQuestion?.marks || '2.00'} / -{currentQuestion?.negativeMarks || '0.66'} Marks
                </span>
              </div>
              
              <div className="flex gap-1 text-[9px] font-bold text-slate-500">
                <span>{currentQuestion?.subjectId?.title || 'Subject'}</span>
                <span>•</span>
                <span>{currentQuestion?.topicId?.title || 'Concept'}</span>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-xs sm:text-sm md:text-[15px] text-slate-100 font-semibold leading-relaxed whitespace-pre-line bg-dark-950/40 border border-slate-850 rounded-xl p-4 sm:p-5">
              {currentQuestion?.questionText}
            </p>

            {/* Options grid */}
            <div className="space-y-2.5">
              {currentQuestion?.options?.map((opt, oidx) => {
                const letter = String.fromCharCode(65 + oidx);
                const isSelected = ansItem?.selectedAnswer === opt;
                
                return (
                  <button
                    key={oidx}
                    onClick={() => handleAnswerSelect(opt)}
                    className={`w-full text-left px-4 py-3 border rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 text-white shadow-md shadow-brand-500/5'
                        : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-dark-900/40'
                    }`}
                  >
                    <span className={`w-5.5 h-5.5 rounded flex items-center justify-center text-[10px] font-black border shrink-0 transition-all ${
                      isSelected
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-dark-900 border-slate-700 text-slate-500'
                    }`}>
                      {letter}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Action buttons controls bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="btn-secondary text-[11px] font-bold px-4.5 py-2.5 border-slate-850 hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <FiChevronLeft className="text-sm" /> Prev
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="btn-primary text-[11px] font-bold px-4.5 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save &amp; Next <FiChevronRight className="text-sm" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClearResponse}
                disabled={!ansItem?.selectedAnswer}
                className="btn-secondary text-[11px] font-bold px-4.5 py-2.5 border-slate-850 text-slate-400 hover:text-white disabled:opacity-30"
              >
                Clear Response
              </button>

              <button
                onClick={handleToggleReview}
                className={`btn-secondary text-[11px] font-bold px-4.5 py-2.5 border-slate-850 transition-all ${
                  ansItem?.isMarkedForReview
                    ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ansItem?.isMarkedForReview ? 'Unmark Review' : 'Mark for Review'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Question Palette (sidebar) */}
        <div className={`w-full md:w-72 shrink-0 space-y-5 md:block ${isPaletteOpen ? 'block fixed inset-0 z-40 bg-[#030712] p-4 overflow-y-auto' : 'hidden'}`}>
          
          {/* Close mobile toggle panel if visible */}
          {isPaletteOpen && (
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 md:hidden">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Exam Navigation</span>
              <button onClick={() => setIsPaletteOpen(false)} className="text-slate-400 hover:text-white p-1">
                <FiX className="text-lg" />
              </button>
            </div>
          )}

          {/* Counts Dashboard summaries */}
          <div className="glass-card border-slate-800 bg-dark-900/40 p-4 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Question Status</h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                <span>Unanswered ({unansweredCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-indigo-650 inline-block" />
                <span>Marked ({markedCount})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 inline-block" />
                <span>Not Visited ({notVisitedCount})</span>
              </div>
            </div>
          </div>

          {/* Grid selection buttons */}
          <div className="glass-card border-slate-800 bg-dark-900/40 p-4 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Question Number</h4>
            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const ans = attempt.answers?.find(a => a.questionId === q._id) || {};
                const isSelected = currentIndex === idx;

                // Color mappings
                let colorClass = 'bg-slate-800 text-slate-450 border border-slate-700/30';
                
                if (ans.selectedAnswer !== null && ans.isMarkedForReview) {
                  // Answered and marked for review
                  colorClass = 'bg-indigo-650 border-2 border-emerald-400 text-white font-extrabold';
                } else if (ans.selectedAnswer !== null) {
                  // Answered
                  colorClass = 'bg-emerald-500 text-white font-extrabold';
                } else if (ans.isMarkedForReview) {
                  // Marked for review (unanswered)
                  colorClass = 'bg-indigo-650 text-white font-extrabold';
                } else if (ans.visited) {
                  // Visited but unanswered
                  colorClass = 'bg-rose-500 text-white font-extrabold';
                }

                // Add border highlight for current selected index
                let borderHighlight = isSelected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-[#030712]' : '';

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsPaletteOpen(false); // Close mobile tray
                    }}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${colorClass} ${borderHighlight}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                <FiCheckSquare className="text-xl" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Confirm Paper Submission</h3>
                <p className="text-[10px] text-slate-550">This action finalize and submits your mock paper attempt.</p>
              </div>
            </div>

            <ul className="space-y-2 border-y border-slate-800 py-3.5 text-xs font-bold text-slate-450">
              <li className="flex justify-between">
                <span>Total Questions</span><span className="text-white">{questions.length}</span>
              </li>
              <li className="flex justify-between text-emerald-400">
                <span>Answered Responses</span><span>{answeredCount}</span>
              </li>
              <li className="flex justify-between text-rose-455">
                <span>Unanswered / Visited</span><span>{unansweredCount}</span>
              </li>
              <li className="flex justify-between text-purple-400">
                <span>Marked for Review</span><span>{markedCount}</span>
              </li>
            </ul>

            <p className="text-xs text-slate-400 leading-relaxed">
              You have <span className="text-rose-400 font-bold">{questions.length - answeredCount} unanswered</span> questions. Do you want to submit and view cutoff details?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="btn-secondary py-2.5 px-4.5 text-xs font-bold"
              >
                Keep Solving
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md shadow-brand-500/15"
              >
                {submitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                <span>Finish &amp; Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
