import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiClock, FiChevronLeft, FiBookOpen, FiBookmark, FiAlertCircle,
  FiCheck, FiX, FiLoader, FiSave, FiAward, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import revisionAPI from '../../api/revisionApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function RevisionQuestion() {
  const { revisionItemId } = useParams();
  const navigate = useNavigate();

  // Core states
  const [item, setItem] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User input states
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState('medium'); // low, medium, high
  const [note, setNote] = useState('');

  // Flow control states
  const [checked, setChecked] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // { correctAnswer, explanation, isCorrect, suggestedAction }
  const [completed, setCompleted] = useState(false);
  const [completeResult, setCompleteResult] = useState(null); // { nextRevisionDate, priority }

  // Action status states
  const [submitting, setSubmitting] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    loadRevisionItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revisionItemId]);

  const loadRevisionItem = async () => {
    setLoading(true);
    setError('');
    setChecked(false);
    setCheckResult(null);
    setCompleted(false);
    setCompleteResult(null);
    setSelectedAnswer('');
    setConfidenceLevel('medium');
    setNote('');

    try {
      const { data } = await revisionAPI.startRevisionItem(revisionItemId);
      if (data.success) {
        setItem(data.item);
        setQuestion(data.question);
        setNote(data.item.note || '');
        if (data.item.confidenceLevel) {
          setConfidenceLevel(data.item.confidenceLevel);
        }
      } else {
        throw new Error('Failed to load question details.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load this revision item.');
      toast.error('Error starting revision question.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckAnswer = async () => {
    if (!selectedAnswer) {
      toast.error('Please select an option first.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await revisionAPI.checkAnswer(revisionItemId, {
        selectedAnswer,
        confidenceLevel,
      });
      if (data.success) {
        setCheckResult(data);
        setChecked(true);
        toast.success(data.isCorrect ? 'Correct! Excellent recall. 🎯' : 'Incorrect. Added to revision track.', { id: 'chk-ans' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to verify answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActionComplete = async (actionType) => {
    setSubmitting(true);
    try {
      const { data } = await revisionAPI.completeRevisionItem(revisionItemId, {
        action: actionType,
        selectedAnswer,
        confidenceLevel,
        note,
      });
      if (data.success) {
        setCompleteResult(data);
        setCompleted(true);
        toast.success(`Revision processed: ${actionType.replace(/_/g, ' ')}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit revision status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      const { data } = await revisionAPI.saveNote(revisionItemId, { noteText: note });
      if (data.success) {
        toast.success('Personal notes updated.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update notes.');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Fetching question card...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Revision Card Missing</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not load item.'}</p>
          </div>
          <Link to="/aspirant/revise-today" className="btn-primary text-xs px-4 py-2 mx-auto justify-center">
            Back to Revise Today
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Link to="/aspirant/revise-today" className="p-2 rounded-xl border border-slate-800 bg-dark-900/40 text-slate-400 hover:text-white transition-colors shrink-0">
            <FiChevronLeft className="text-lg" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <FiBookOpen className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Active Revision Deck</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Active Item Check</h1>
          </div>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Revise Today" />

          {/* Right Main Revision Workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Question Card */}
            <div className="glass-card bg-dark-900/40 border-slate-800 p-6 sm:p-8 space-y-5">
              
              {/* Question metadata badge row */}
              <div className="flex justify-between items-center flex-wrap gap-2.5 pb-2 border-b border-slate-850">
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-bold">
                  <span className="text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded uppercase">
                    Level: {question.difficulty || 'Mixed'}
                  </span>
                  {question.subject && (
                    <span className="text-slate-350 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded">
                      Subject: {question.subject}
                    </span>
                  )}
                  {question.topic && (
                    <span className="text-slate-400 bg-slate-800/50 border border-slate-750/50 px-2 py-0.5 rounded">
                      Topic: {question.topic}
                    </span>
                  )}
                </div>
                
                <div className="text-[10px] font-bold text-slate-500">
                  Revision attempt #{item.revisionCount + 1}
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-[15px] text-slate-100 leading-relaxed font-semibold whitespace-pre-line bg-dark-950/40 border border-slate-850 rounded-xl p-4 sm:p-5">
                {question.questionText}
              </p>

              {/* Options selection */}
              <div className="space-y-2.5">
                {question.options?.map((opt, oidx) => {
                  const letter = String.fromCharCode(65 + oidx);
                  const isSelected = selectedAnswer === opt;
                  
                  // Style modifiers after check
                  let optStyle = isSelected
                    ? 'bg-brand-500/10 border-brand-500 text-white shadow-md shadow-brand-500/10'
                    : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-dark-900/40';

                  if (checked && checkResult) {
                    const isCorrectOpt = opt === checkResult.correctAnswer;
                    const isSelectedOpt = opt === selectedAnswer;
                    
                    if (isCorrectOpt) {
                      optStyle = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-extrabold cursor-default';
                    } else if (isSelectedOpt) {
                      optStyle = 'border-rose-500/30 bg-rose-500/10 text-rose-400 font-extrabold cursor-default';
                    } else {
                      optStyle = 'border-slate-850 bg-dark-950/20 text-slate-650 cursor-default select-none';
                    }
                  }

                  return (
                    <button
                      key={oidx}
                      disabled={checked}
                      onClick={() => setSelectedAnswer(opt)}
                      className={`w-full text-left px-4 sm:px-5 py-3 border rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all ${optStyle}`}
                    >
                      <span className={`w-5.5 h-5.5 rounded flex items-center justify-center text-[10px] font-black border shrink-0 transition-all ${
                        isSelected && !checked
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : checked && opt === checkResult?.correctAnswer
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : checked && opt === selectedAnswer
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'bg-dark-900 border-slate-700 text-slate-500'
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {checked && opt === checkResult?.correctAnswer && <FiCheck className="text-emerald-400 shrink-0" />}
                      {checked && opt === selectedAnswer && opt !== checkResult?.correctAnswer && <FiX className="text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Step 1: Check Answer controls */}
              {!checked && !completed && (
                <div className="border-t border-slate-850 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Confidence selector */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Confidence:</span>
                    <div className="flex bg-dark-950 border border-slate-850 rounded-xl p-0.5">
                      {['low', 'medium', 'high'].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setConfidenceLevel(lvl)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${
                            confidenceLevel === lvl
                              ? 'bg-slate-800 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCheckAnswer}
                    disabled={!selectedAnswer || submitting}
                    className="btn-primary py-2.5 px-6 text-xs font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-500/10"
                  >
                    {submitting ? <FiLoader className="animate-spin" /> : 'Check Answer'}
                  </button>
                </div>
              )}

              {/* Step 2: Answer Key & Explanation (visible after check) */}
              {checked && (
                <div className="space-y-4 pt-4 border-t border-slate-850">
                  
                  {/* Status Banner */}
                  <div className={`p-4 border rounded-xl flex items-start gap-3 ${
                    checkResult?.isCorrect
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-450'
                      : 'border-rose-500/20 bg-rose-500/5 text-rose-450'
                  }`}>
                    {checkResult?.isCorrect ? (
                      <FiCheck className="text-lg shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <FiX className="text-lg shrink-0 mt-0.5 text-rose-400" />
                    )}
                    <div className="text-xs">
                      <p className="font-bold">
                        {checkResult?.isCorrect ? 'Correct Response' : 'Incorrect Response'}
                      </p>
                      <p className="text-[10px] opacity-80 mt-0.5 leading-relaxed">
                        Spaced interval scheduler recommends: <span className="font-bold uppercase tracking-wider">{checkResult?.suggestedAction?.replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Explanation text */}
                  {checkResult?.explanation && (
                    <div className="p-4 bg-dark-950/60 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                      <strong className="text-slate-300 font-bold block mb-1">Explanation &amp; Solution Key:</strong>
                      {checkResult.explanation}
                    </div>
                  )}

                  {/* Complete status options selection */}
                  {!completed && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Select scheduling response action:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { action: 'revised',          label: 'Revised',          color: 'border-brand-500/20 text-brand-400 hover:bg-brand-500/10' },
                          { action: 'mastered',         label: 'Mastered',         color: 'border-emerald-500/20 text-emerald-450 hover:bg-emerald-500/10' },
                          { action: 'incorrect_again',  label: 'Still Confused',   color: 'border-rose-500/20 text-rose-450 hover:bg-rose-500/10' },
                          { action: 'skipped',          label: 'Skip Tomorrow',    color: 'border-slate-800 text-slate-400 hover:bg-slate-800/50' },
                        ].map(opt => (
                          <button
                            key={opt.action}
                            disabled={submitting}
                            onClick={() => handleActionComplete(opt.action)}
                            className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all ${opt.color}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Complete Status display (Scheduler results) */}
              {completed && completeResult && (
                <div className="p-5 bg-brand-500/5 border border-brand-500/20 rounded-xl space-y-4 pt-4 border-t border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                      <FiAward className="text-lg" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Revision Action Logged</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Spaced repetition deck successfully rescheduled.</p>
                    </div>
                  </div>

                  <ul className="grid grid-cols-2 gap-3 text-[11px] font-bold border-y border-slate-850 py-3">
                    <li className="flex justify-between text-slate-400">
                      <span>Rescheduled Date</span>
                      <span className="text-white">
                        {new Date(completeResult.nextRevisionDate).toLocaleDateString()}
                      </span>
                    </li>
                    <li className="flex justify-between text-slate-400">
                      <span>Priority Tier</span>
                      <span className="text-brand-400 uppercase">{completeResult.item?.priority || 'medium'}</span>
                    </li>
                    <li className="flex justify-between text-slate-400">
                      <span>Mastery Score</span>
                      <span className="text-emerald-400">{completeResult.item?.masteryScore || 0}%</span>
                    </li>
                    <li className="flex justify-between text-slate-400">
                      <span>Status</span>
                      <span className="text-slate-300 capitalize">{completeResult.item?.status || 'pending'}</span>
                    </li>
                  </ul>

                  {/* Next question navigation triggers */}
                  <div className="flex gap-2.5 pt-1">
                    <Link to="/aspirant/revise-today" className="btn-secondary py-2.5 px-4 text-xs font-bold">
                      Back to Revise Today
                    </Link>
                    <button
                      onClick={() => navigate('/aspirant/revise-today')}
                      className="btn-primary py-2.5 px-5 text-xs font-bold"
                    >
                      Next Question <FiArrowRight />
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Note Editor Box */}
            <div className="glass-card bg-dark-900/40 border-slate-800 p-6 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Personal Study Notes</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Write custom retention tricks or hints for this question.</p>
              </div>

              <textarea
                placeholder="Type personal concepts review notes here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full bg-dark-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-550 focus:border-brand-500 focus:outline-none transition-all resize-none"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="btn-secondary text-[11px] font-bold px-4 py-2 border-slate-850 hover:bg-dark-900"
                >
                  {savingNote ? <FiLoader className="animate-spin" /> : <><FiSave /> Save Note</>}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
