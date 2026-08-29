import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiClock, FiBookmark, FiChevronLeft, FiChevronRight,
  FiAlertCircle, FiSend, FiMenu, FiX, FiCheckSquare
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';

const AUTO_SAVE_INTERVAL = 10000; // 10 seconds

function formatTime(seconds) {
  if (seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function QuestionPalette({ questions, responses, markedForReview, currentIdx, onJump }) {
  const getStatus = (idx) => {
    const q = questions[idx];
    if (!q) return 'unattempted';
    const res = responses[q._id];
    const marked = markedForReview[q._id];
    if (marked && res !== undefined && res !== null && res !== '') return 'answered_marked';
    if (marked) return 'marked';
    if (res !== undefined && res !== null && res !== '') return 'answered';
    return 'unattempted';
  };

  const statusStyles = {
    answered:        'bg-emerald-500 text-white',
    answered_marked: 'bg-purple-500 text-white',
    marked:          'bg-amber-500 text-white',
    unattempted:     'bg-dark-800 text-slate-400 border border-slate-700',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((_, idx) => (
        <button
          key={idx}
          onClick={() => onJump(idx)}
          className={`w-8 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${statusStyles[getStatus(idx)]} ${currentIdx === idx ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-900 scale-110' : ''}`}
        >
          {idx + 1}
        </button>
      ))}
    </div>
  );
}

export default function PYQPaperAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const pendingSave = useRef({});

  useEffect(() => {
    loadAttempt();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(autoSaveRef.current);
    };
  }, [attemptId]);

  const loadAttempt = async () => {
    setLoading(true);
    try {
      const { data } = await pyqAPI.getAttempt(attemptId);
      setAttempt(data.attempt);
      setPaper(data.paper);
      const qs = data.attempt.questionSnapshot || [];
      setQuestions(qs);

      // Restore previous responses
      const savedResponses = {};
      const savedMarked = {};
      const savedBookmarks = {};
      for (const r of data.attempt.responses || []) {
        if (r.questionId) {
          savedResponses[r.questionId] = r.selectedOption ?? r.answer;
          if (r.markedForReview) savedMarked[r.questionId] = true;
          if (r.bookmarked) savedBookmarks[r.questionId] = true;
        }
      }
      setResponses(savedResponses);
      setMarkedForReview(savedMarked);
      setBookmarked(savedBookmarks);

      // Calculate time left
      const endTime = new Date(data.attempt.endTime).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (data.attempt.status === 'submitted') {
        navigate(`/aspirant/pyq-papers/attempt/${attemptId}/result`, { replace: true });
        return;
      }

      startTimer(remaining, endTime);
      startAutoSave();
    } catch (err) {
      toast.error('Failed to load attempt.');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = (initial, endTime) => {
    clearInterval(timerRef.current);
    setTimeLeft(initial);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleAutoSubmit();
      }
    }, 1000);
  };

  const startAutoSave = () => {
    clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      flushPendingSave();
    }, AUTO_SAVE_INTERVAL);
  };

  const flushPendingSave = useCallback(async () => {
    const entries = Object.entries(pendingSave.current);
    if (entries.length === 0) return;
    pendingSave.current = {};
    for (const [questionId, data] of entries) {
      try {
        await pyqAPI.saveAnswer(attemptId, { questionId, ...data });
      } catch (err) { /* silent */ }
    }
  }, [attemptId]);

  const handleAnswer = (questionId, selectedOption) => {
    setResponses(prev => ({ ...prev, [questionId]: selectedOption }));
    pendingSave.current[questionId] = {
      selectedOption,
      markedForReview: markedForReview[questionId] || false,
      bookmarked: bookmarked[questionId] || false,
    };
  };

  const handleMarkReview = async (questionId) => {
    const newVal = !markedForReview[questionId];
    setMarkedForReview(prev => ({ ...prev, [questionId]: newVal }));
    pendingSave.current[questionId] = {
      selectedOption: responses[questionId],
      markedForReview: newVal,
      bookmarked: bookmarked[questionId] || false,
    };
  };

  const handleBookmark = async (questionId) => {
    const newVal = !bookmarked[questionId];
    setBookmarked(prev => ({ ...prev, [questionId]: newVal }));
    try {
      await pyqAPI.bookmark(attemptId, { questionId, bookmarked: newVal });
    } catch (err) { /* silent */ }
  };

  const handleAutoSubmit = async () => {
    try {
      await flushPendingSave();
      await pyqAPI.autoSubmitAttempt(attemptId);
      navigate(`/aspirant/pyq-papers/attempt/${attemptId}/result`);
    } catch (err) {
      toast.error('Auto-submit failed. Please submit manually.');
    }
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);
    try {
      await flushPendingSave();
      await pyqAPI.submitAttempt(attemptId);
      toast.success('Paper submitted!');
      navigate(`/aspirant/pyq-papers/attempt/${attemptId}/result`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = questions[currentIdx];

  const answeredCount = Object.values(responses).filter(v => v !== undefined && v !== null && v !== '').length;
  const markedCount = Object.values(markedForReview).filter(Boolean).length;
  const unattemptedCount = questions.length - answeredCount;

  const timerColor = timeLeft !== null
    ? timeLeft < 300 ? 'text-rose-400' : timeLeft < 600 ? 'text-amber-400' : 'text-emerald-400'
    : 'text-slate-400';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading exam environment…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#030712]/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowPalette(v => !v)}
              className="lg:hidden p-2 rounded-lg bg-dark-800 text-slate-400"
            >
              <FiMenu />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 truncate">{paper?.title}</p>
              <p className="text-xs font-semibold text-white truncate">Q {currentIdx + 1} of {questions.length}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 text-lg font-black tabular-nums ${timerColor}`}>
            <FiClock /> {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60"
          >
            <FiSend /> Submit
          </button>
        </div>
      </div>

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-6 gap-6">

        {/* Question Panel */}
        <div className="flex-1 flex flex-col gap-4">
          {currentQ ? (
            <>
              {/* Question Card */}
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-dark-800 px-2 py-0.5 rounded-md">Q{currentIdx + 1}</span>
                    {currentQ.subjectId?.title && (
                      <span className="text-[10px] text-slate-500 bg-dark-800 px-2 py-0.5 rounded-md">{currentQ.subjectId.title}</span>
                    )}
                    {markedForReview[currentQ._id] && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">Marked for Review</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBookmark(currentQ._id)}
                      className={`p-2 rounded-lg transition-all ${bookmarked[currentQ._id] ? 'bg-amber-500/15 text-amber-400' : 'bg-dark-800 text-slate-500 hover:text-amber-400'}`}
                      title="Bookmark"
                    >
                      <FiBookmark className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-slate-200 text-base leading-relaxed">
                  {currentQ.questionText}
                </div>

                {/* Image if any */}
                {currentQ.questionImage && (
                  <img
                    src={currentQ.questionImage}
                    alt="Question"
                    className="max-w-full rounded-xl border border-slate-700 max-h-60 object-contain"
                  />
                )}

                {/* Options */}
                <div className="space-y-2.5">
                  {(currentQ.options || []).map((opt, oi) => {
                    const optKey = String.fromCharCode(65 + oi);
                    const isSelected = responses[currentQ._id] === optKey;
                    return (
                      <button
                        key={oi}
                        onClick={() => handleAnswer(currentQ._id, optKey)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                            : 'bg-dark-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-dark-700'
                        }`}
                      >
                        <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${
                          isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-slate-600 text-slate-500'
                        }`}>{optKey}</span>
                        <span className="flex-1">{typeof opt === 'object' ? opt.text : opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Marks info */}
                <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                  {currentQ.marks > 0 && <span className="text-emerald-400 font-semibold">+{currentQ.marks} marks</span>}
                  {currentQ.negativeMarks > 0 && <span className="text-rose-400 font-semibold">–{currentQ.negativeMarks} wrong</span>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setResponses(prev => { const n = { ...prev }; delete n[currentQ._id]; return n; });
                    pendingSave.current[currentQ._id] = { selectedOption: null, markedForReview: markedForReview[currentQ._id], bookmarked: bookmarked[currentQ._id] };
                  }}
                  className="px-4 py-2 bg-dark-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition-all"
                >
                  Clear Response
                </button>
                <button
                  onClick={() => handleMarkReview(currentQ._id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    markedForReview[currentQ._id]
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-dark-800 border-slate-700 text-slate-400 hover:text-amber-400'
                  }`}
                >
                  {markedForReview[currentQ._id] ? 'Unmark Review' : 'Mark for Review'}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1.5 px-4 py-2 bg-dark-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl disabled:opacity-40 transition-all"
                  >
                    <FiChevronLeft /> Prev
                  </button>
                  <button
                    onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))}
                    disabled={currentIdx === questions.length - 1}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl disabled:opacity-40 transition-all"
                  >
                    {responses[currentQ._id] !== undefined && responses[currentQ._id] !== null && responses[currentQ._id] !== ''
                      ? 'Save & Next' : 'Next'} <FiChevronRight />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-slate-500">No questions found.</div>
          )}
        </div>

        {/* Right Palette (desktop) */}
        <div className="hidden lg:flex flex-col w-64 gap-4 shrink-0">
          {/* Summary */}
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progress</h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                ['Answered', answeredCount, 'text-emerald-400'],
                ['Unattempted', unattemptedCount, 'text-slate-400'],
                ['Marked', markedCount, 'text-amber-400'],
                ['Total', questions.length, 'text-white'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-dark-800 rounded-xl p-2">
                  <p className={`text-lg font-black ${color}`}>{val}</p>
                  <p className="text-[9px] text-slate-500 uppercase">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question Palette */}
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 flex-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question Palette</h3>
            <QuestionPalette
              questions={questions}
              responses={responses}
              markedForReview={markedForReview}
              currentIdx={currentIdx}
              onJump={setCurrentIdx}
            />
            {/* Legend */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              {[
                ['bg-emerald-500', 'Answered'],
                ['bg-amber-500', 'Marked for Review'],
                ['bg-purple-500', 'Answered + Marked'],
                ['bg-dark-800 border border-slate-700', 'Unattempted'],
              ].map(([cls, label]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm shrink-0 ${cls}`} />
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <FiSend /> Submit Paper
          </button>
        </div>
      </div>

      {/* Mobile Palette */}
      {showPalette && (
        <div className="fixed inset-0 z-50 bg-black/70 lg:hidden" onClick={() => setShowPalette(false)}>
          <div
            className="absolute right-0 top-0 h-full w-80 bg-[#0a0f1e] border-l border-slate-800 p-4 overflow-y-auto space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Question Palette</h3>
              <button onClick={() => setShowPalette(false)} className="text-slate-400"><FiX /></button>
            </div>
            <QuestionPalette
              questions={questions}
              responses={responses}
              markedForReview={markedForReview}
              currentIdx={currentIdx}
              onJump={(idx) => { setCurrentIdx(idx); setShowPalette(false); }}
            />
            <button
              onClick={() => { setShowPalette(false); setShowConfirm(true); }}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl"
            >
              Submit Paper
            </button>
          </div>
        </div>
      )}

      {/* Confirm Submit Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0d1424] border border-slate-700 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center">
              <FiAlertCircle className="text-4xl text-amber-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white">Submit Paper?</h3>
              <p className="text-slate-400 text-sm mt-2">This action cannot be undone. Your paper will be evaluated.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Answered', answeredCount, 'text-emerald-400'],
                ['Unattempted', unattemptedCount, 'text-slate-400'],
                ['Marked', markedCount, 'text-amber-400'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-dark-800 rounded-xl p-2">
                  <p className={`text-xl font-black ${color}`}>{val}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            {unattemptedCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <FiAlertCircle className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">{unattemptedCount} question{unattemptedCount !== 1 ? 's' : ''} unattempted.</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 bg-dark-800 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm"
              >
                Go Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
