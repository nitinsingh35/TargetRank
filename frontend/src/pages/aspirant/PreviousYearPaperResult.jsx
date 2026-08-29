import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiAward, FiCheck, FiX, FiClock, FiPercent, FiArrowRight,
  FiBookOpen, FiSliders, FiBookmark, FiList, FiAlertCircle, FiLoader,
  FiBook, FiTrendingDown, FiCheckSquare, FiRotateCcw, FiEye, FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import previousYearPaperAPI from '../../api/previousYearPaperApi.js';
import questionAPI from '../../api/questionApi.js';

export default function PreviousYearPaperResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkingId, setBookmarkingId] = useState(null);

  const fetchResult = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: resData } = await previousYearPaperAPI.getAttemptResult(attemptId);
      if (resData.success) {
        setData(resData);
      } else {
        setError('Failed to fetch paper result scorecard.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Results are not available. This mock attempt might not be finalized or submitted yet.'
      );
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const handleToggleBookmark = async (qId) => {
    setBookmarkingId(qId);
    try {
      const { data: bookmarkRes } = await questionAPI.toggleBookmark(qId);
      toast.success(bookmarkRes.bookmarked ? 'Question bookmarked!' : 'Bookmark removed.');
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const updatedQuestions = prev.reviewedQuestions.map(q => {
          if (q.questionId === qId) {
            return { ...q, isBookmarked: bookmarkRes.bookmarked };
          }
          return q;
        });
        return { ...prev, reviewedQuestions: updatedQuestions };
      });
    } catch (err) {
      console.error('Failed to toggle bookmark status', err);
      toast.error('Could not modify bookmark state.');
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleAttemptAgain = async () => {
    if (!data?.attempt?.paperId) return;
    const toastId = toast.loading('Starting new paper attempt...');
    try {
      const { data: attemptRes } = await previousYearPaperAPI.startAttempt(data.attempt.paperId);
      if (attemptRes.success && attemptRes.attempt) {
        toast.success('Attempt loaded successfully.', { id: toastId });
        navigate(`/aspirant/previous-year-papers/attempt/${attemptRes.attempt._id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start a new paper attempt.', { id: toastId });
    }
  };

  // Helper to format duration in MM:SS or HH:MM:SS
  const formatDuration = (totalSecs) => {
    if (!totalSecs) return '0m 0s';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Generating performance report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Result Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not fetch attempt scorecard.'}</p>
          </div>
          <div className="flex gap-2.5 justify-center">
            <Link
              to="/aspirant/previous-year-papers"
              className="btn-secondary text-xs px-4 py-2 hover:bg-slate-900 border-slate-800"
            >
              Back to Library
            </Link>
            <button onClick={fetchResult} className="btn-primary text-xs px-4 py-2">
              Retry Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { attempt = {}, reviewedQuestions = [] } = data;

  // Derive negative marking penalty impact
  const negativePenalty = reviewedQuestions
    .filter(q => q.status === 'incorrect')
    .reduce((sum, q) => sum + (q.negativeMarks || 0), 0);

  // Weak/Strong topics lists
  const weakTopics = (attempt.topicPerformance || []).filter(t => t.accuracy < 50);
  const strongTopics = (attempt.topicPerformance || []).filter(t => t.accuracy >= 80);

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Link to="/aspirant/paper-attempt-history" className="hover:text-brand-400 transition-colors">
            Attempt History
          </Link>
          <span>/</span>
          <span className="text-slate-400">Mock Scorecard</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
              <FiAward className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Scorecard Analysis</h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Simulated attempt for: <strong className="text-slate-350">{attempt.paperTitle}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => navigate('/aspirant/previous-year-papers')}
              className="btn-secondary text-[11px] font-bold px-3 py-2 border-slate-850 hover:bg-slate-900"
            >
              All PYQ Papers
            </button>
            <button
              onClick={handleAttemptAgain}
              className="btn-primary text-[11px] font-bold px-4 py-2"
            >
              <FiRotateCcw /> Attempt Again
            </button>
          </div>
        </div>

        {/* 1. Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Earned Score</p>
            <p className="text-2xl font-extrabold text-white">
              {attempt.score} <span className="text-xs text-slate-500 font-bold">/ {attempt.totalMarks}</span>
            </p>
            <p className="text-[9px] font-semibold text-slate-550 uppercase">
              {attempt.autoSubmitted ? 'Auto Submitted' : 'Manual Submitted'}
            </p>
          </div>

          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Accuracy</p>
            <p className="text-2xl font-extrabold text-brand-400">
              {attempt.accuracy}%
            </p>
            <p className="text-[9px] font-semibold text-slate-550 uppercase">On Attempted Items</p>
          </div>

          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Time Taken</p>
            <p className="text-2xl font-extrabold text-slate-350">
              {formatDuration(attempt.timeTakenSeconds)}
            </p>
            <p className="text-[9px] font-semibold text-slate-550 uppercase">Session Duration</p>
          </div>

          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Question Split</p>
            <p className="text-lg font-extrabold text-slate-300 mt-1.5 flex justify-center gap-1 text-[11px]">
              <span className="text-emerald-450">+{attempt.correctCount} Correct</span>
              <span>/</span>
              <span className="text-rose-455">-{attempt.incorrectCount} Wrong</span>
              <span>/</span>
              <span className="text-slate-500">{attempt.skippedCount} Skip</span>
            </p>
          </div>
        </div>

        {/* 2. Performance Analytics Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Columns: performance tables */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Section performance */}
            {attempt.sectionPerformance?.length > 0 && (
              <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiList className="text-brand-400" /> Section-Wise Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-semibold text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5">Section Name</th>
                        <th className="py-2.5 text-center">Total</th>
                        <th className="py-2.5 text-center text-emerald-400">Correct</th>
                        <th className="py-2.5 text-center text-rose-450">Incorrect</th>
                        <th className="py-2.5 text-center">Score</th>
                        <th className="py-2.5 text-right">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {attempt.sectionPerformance.map((sec, idx) => (
                        <tr key={idx} className="hover:bg-dark-950/20">
                          <td className="py-2.5 text-white font-extrabold">{sec.sectionName}</td>
                          <td className="py-2.5 text-center">{sec.total}</td>
                          <td className="py-2.5 text-center text-emerald-400">{sec.correct}</td>
                          <td className="py-2.5 text-center text-rose-450">{sec.incorrect}</td>
                          <td className="py-2.5 text-center font-bold text-slate-205">{sec.score}</td>
                          <td className="py-2.5 text-right text-brand-400">{sec.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Subject performance */}
            {attempt.subjectPerformance?.length > 0 && (
              <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiBookOpen className="text-brand-400" /> Subject-Wise Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-semibold text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5">Subject</th>
                        <th className="py-2.5 text-center">Total</th>
                        <th className="py-2.5 text-center text-emerald-400">Correct</th>
                        <th className="py-2.5 text-center text-rose-450">Incorrect</th>
                        <th className="py-2.5 text-center">Score</th>
                        <th className="py-2.5 text-right">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {attempt.subjectPerformance.map((sub, idx) => (
                        <tr key={idx} className="hover:bg-dark-950/20">
                          <td className="py-2.5 text-white font-extrabold">{sub.subjectName}</td>
                          <td className="py-2.5 text-center">{sub.total}</td>
                          <td className="py-2.5 text-center text-emerald-400">{sub.correct}</td>
                          <td className="py-2.5 text-center text-rose-450">{sub.incorrect}</td>
                          <td className="py-2.5 text-center font-bold text-slate-205">{sub.score}</td>
                          <td className="py-2.5 text-right text-brand-400">{sub.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Topic performance */}
            {attempt.topicPerformance?.length > 0 && (
              <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiSliders className="text-brand-400" /> Topic-Wise Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-semibold text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-2.5">Topic</th>
                        <th className="py-2.5 text-center">Total</th>
                        <th className="py-2.5 text-center text-emerald-400">Correct</th>
                        <th className="py-2.5 text-center text-rose-450">Incorrect</th>
                        <th className="py-2.5 text-center">Score</th>
                        <th className="py-2.5 text-right">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {attempt.topicPerformance.map((top, idx) => (
                        <tr key={idx} className="hover:bg-dark-950/20">
                          <td className="py-2.5 text-white font-extrabold">{top.topicName}</td>
                          <td className="py-2.5 text-center">{top.total}</td>
                          <td className="py-2.5 text-center text-emerald-400">{top.correct}</td>
                          <td className="py-2.5 text-center text-rose-450">{top.incorrect}</td>
                          <td className="py-2.5 text-center font-bold text-slate-205">{top.score}</td>
                          <td className="py-2.5 text-right text-brand-400">{top.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: analytics insights summaries */}
          <div className="space-y-6">
            
            {/* Negative Marking Impact */}
            <div className="glass-card p-5 border-rose-500/20 bg-rose-500/5 space-y-2">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiAlertCircle /> Negative Marking Impact
              </h4>
              <p className="text-2xl font-black text-white">-{negativePenalty.toFixed(2)} <span className="text-[10px] text-slate-500 font-bold">Marks lost</span></p>
              <p className="text-[10px] text-slate-450 leading-relaxed">
                You gave wrong responses to <span className="text-rose-400 font-bold">{attempt.incorrectCount} questions</span>, penalising your final score by negative marks. Bypassing wild guesses could raise your standing.
              </p>
            </div>

            {/* Weak / Strong topics tags */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              
              {/* Weak topics list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiTrendingDown /> Weak Areas (&lt;50% accuracy)
                </h4>
                {weakTopics.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">None detected in this paper! Great work.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {weakTopics.map((wt, idx) => (
                      <span key={idx} className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-550/15 px-2.5 py-1 rounded">
                        {wt.topicName} ({wt.accuracy}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Strong topics list */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiCheck /> Strong Areas (&gt;=80% accuracy)
                </h4>
                {strongTopics.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">None detected yet. Review explanations below.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {strongTopics.map((st, idx) => (
                      <span key={idx} className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-550/15 px-2.5 py-1 rounded">
                        {st.topicName} ({st.accuracy}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Next suggestions actions */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiActivity className="text-brand-450" /> Suggested Actions
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {attempt.accuracy >= 75
                  ? 'Excellent execution! Retest using other Years\' papers to build confidence in actual Cut-Off ranges.'
                  : 'Focus on weak topics showing below 50% accuracy. Run Mistake revisions or customized weak-topic smart drills to resolve gaps.'}
              </p>
              
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => navigate('/aspirant/weak-topics')}
                  className="btn-secondary w-full py-2.5 text-[10px] font-bold border-slate-850 hover:bg-dark-900 justify-center"
                >
                  Practice Weak Topics
                </button>
                <button
                  onClick={() => navigate('/aspirant/mistake-notebook')}
                  className="btn-secondary w-full py-2.5 text-[10px] font-bold border-slate-850 hover:bg-dark-900 justify-center"
                >
                  Open Mistake Notebook
                </button>
                <button
                  onClick={() => navigate('/aspirant/paper-attempt-history')}
                  className="btn-secondary w-full py-2.5 text-[10px] font-bold border-slate-850 hover:bg-dark-900 justify-center"
                >
                  View Attempt History
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Detailed Question-by-Question Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FiCheckSquare className="text-brand-400" />
            <h2 className="text-base font-extrabold text-white">Question Review</h2>
          </div>

          <div className="space-y-6">
            {reviewedQuestions.map((q, idx) => {
              const qIdStr = q.questionId;
              const isCorrect  = q.status === 'correct';
              const isIncorrect = q.status === 'incorrect';
              const isSkipped   = q.status === 'skipped';

              return (
                <div
                  key={idx}
                  className={`glass-card p-6 sm:p-8 bg-dark-900/40 border transition-all space-y-4 ${
                    isCorrect
                      ? 'border-emerald-500/10 hover:border-emerald-500/20'
                      : isIncorrect
                        ? 'border-rose-500/10 hover:border-rose-500/20'
                        : 'border-slate-800 hover:border-slate-750'
                  }`}
                >
                  
                  {/* Status header banner */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-850 flex-wrap gap-2.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="text-slate-400">Question {idx + 1}</span>
                      
                      {isCorrect && (
                        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-505/20 px-2 py-0.5 rounded uppercase">
                          Correct (+{q.marks} Marks)
                        </span>
                      )}
                      {isIncorrect && (
                        <span className="text-rose-400 bg-rose-500/10 border border-rose-505/20 px-2 py-0.5 rounded uppercase">
                          Incorrect (-{q.negativeMarks} Marks)
                        </span>
                      )}
                      {isSkipped && (
                        <span className="text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded uppercase">
                          Skipped
                        </span>
                      )}
                    </div>

                    {/* Bookmark action toggle */}
                    <button
                      onClick={() => handleToggleBookmark(qIdStr)}
                      disabled={bookmarkingId === qIdStr}
                      className={`p-2 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-white transition-all disabled:opacity-50`}
                      title="Bookmark Question"
                    >
                      {bookmarkingId === qIdStr ? (
                        <FiLoader className="text-sm animate-spin" />
                      ) : (
                        <FiBookmark className={`text-sm ${q.isBookmarked ? 'fill-current text-brand-450' : ''}`} />
                      )}
                    </button>
                  </div>

                  {/* Question Content */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                    {q.questionText}
                  </p>

                  {/* Subject and Topic Chips */}
                  <div className="flex gap-1.5 flex-wrap text-[10px] font-bold text-slate-400">
                    <span className="bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded">
                      Subject: {q.subject}
                    </span>
                    <span className="bg-slate-800/30 border border-slate-700/30 px-2 py-0.5 rounded">
                      Topic: {q.topic}
                    </span>
                  </div>

                  {/* Options List layout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options?.map((opt, oidx) => {
                      const isCorrectOpt  = opt === q.correctAnswer;
                      const isSelectedOpt = opt === q.selectedAnswer;

                      let optClass = 'border-slate-850 bg-dark-950/60 text-slate-500';
                      if (isCorrectOpt) {
                        optClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-extrabold';
                      } else if (isSelectedOpt) {
                        optClass = 'border-rose-500/30 bg-rose-500/10 text-rose-400 font-extrabold';
                      }

                      return (
                        <div
                          key={oidx}
                          className={`px-4 py-2.5 border rounded-lg text-xs flex justify-between items-center ${optClass}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold opacity-80">{String.fromCharCode(65 + oidx)}.</span>
                            <span>{opt}</span>
                          </div>
                          {isCorrectOpt && <FiCheck className="text-emerald-400 shrink-0 text-xs" />}
                          {isSelectedOpt && !isCorrectOpt && <FiX className="text-rose-400 shrink-0 text-xs" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Solutions / Explanation */}
                  {q.explanation && (
                    <div className="p-4 bg-dark-950/40 border border-slate-850 rounded-xl text-xs text-slate-450 leading-relaxed whitespace-pre-line">
                      <strong className="text-slate-300 font-bold block mb-1">Explanation:</strong>
                      {q.explanation}
                    </div>
                  )}

                  {/* Integration warnings: added to mistake deck or bookmarks */}
                  <div className="space-y-3 pt-2 border-t border-slate-850/50">
                    {isIncorrect && (
                      <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5 text-xs text-rose-400">
                        <span>This question is added to your Mistake Notebook as a Mock Test item.</span>
                        <button
                          onClick={() => navigate('/aspirant/mistake-notebook')}
                          className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-450 font-bold px-3 py-1.5 rounded-lg transition-all text-[10px]"
                        >
                          Open Mistake Notebook
                        </button>
                      </div>
                    )}

                    {q.isBookmarked && (
                      <div className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-xs text-amber-400">
                        <span>This question is bookmarked in your revision settings.</span>
                        <button
                          onClick={() => navigate('/aspirant/bookmarks')}
                          className="bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-450 font-bold px-3 py-1.5 rounded-lg transition-all text-[10px]"
                        >
                          View Bookmarks
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1.5">
                      <button
                        disabled
                        className="bg-slate-850/30 text-slate-650 border border-slate-850 px-3 py-2 rounded-xl text-[10px] font-bold cursor-not-allowed select-none"
                      >
                        Practice Similar Questions — Placeholder
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
