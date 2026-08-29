import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiAward, FiCheck, FiX, FiClock, FiPercent, 
  FiArrowRight, FiBookOpen, FiSliders, FiBookmark, 
  FiList, FiAlertCircle, FiLoader 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';

export default function MockTestResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkingId, setBookmarkingId] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await mockTestAPI.getResult(attemptId);
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Results scorecard is not generated or unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (questionId) => {
    setBookmarkingId(questionId);
    try {
      const { data: bookmarkRes } = await mockTestAPI.bookmark(attemptId, { questionId });
      toast.success(bookmarkRes.isBookmarked ? 'Question bookmarked!' : 'Bookmark removed.');
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const updatedQuestions = prev.reviewedQuestions.map(q => 
          q.questionId === questionId ? { ...q, isBookmarked: bookmarkRes.isBookmarked } : q
        );
        return { ...prev, reviewedQuestions: updatedQuestions };
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update bookmark status.');
    } finally {
      setBookmarkingId(null);
    }
  };

  const formatDuration = (secs) => {
    if (secs === null || secs === undefined || isNaN(secs)) return '0s';
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Analyzing mock scorecard result...</p>
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
            <h2 className="text-lg font-bold text-white">Oops! Scorecard Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Scorecard is not available.'}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/aspirant/mock-tests" className="btn-secondary text-xs px-4 py-2">
              Mock Tests Suite
            </Link>
            <button onClick={fetchResult} className="btn-primary text-xs px-4 py-2">
              Retry Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { attempt = {}, mockTest = {}, reviewedQuestions = [] } = data;
  const sections = attempt.sectionPerformance || [];
  const subjects = attempt.subjectPerformance || [];
  const topics = attempt.topicPerformance || [];
  const feedback = attempt.feedback || {};

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">

        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Link to="/aspirant/mock-tests" className="hover:text-brand-400 transition-colors flex items-center gap-1">
            <FiList className="text-[10px]" /> Mock Tests Suite
          </Link>
          <span>/</span>
          <span className="text-slate-400">Scorecard Analysis</span>
        </div>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <FiAward className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mock Scorecard</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Review details for: <strong className="text-slate-355">{mockTest.title}</strong>
            </p>
          </div>
        </div>

        {/* 1. Scorecard summary metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="glass-card p-4 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Secure Score</p>
            <p className="text-xl font-extrabold text-white">
              {attempt.score} <span className="text-[10px] text-slate-500 font-bold">/ {attempt.totalMarks}</span>
            </p>
          </div>

          <div className="glass-card p-4 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Accuracy</p>
            <p className="text-xl font-extrabold text-brand-400">{attempt.accuracy}%</p>
          </div>

          <div className="glass-card p-4 bg-[#030712]/30 border-slate-800 text-center space-y-1 col-span-2 lg:col-span-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Duration Attempt</p>
            <p className="text-base font-extrabold text-slate-300 truncate">{formatDuration(attempt.timeTakenSeconds)}</p>
          </div>

          {/* Ranks & Percentiles with fallback mode */}
          <div className="glass-card p-4 bg-[#030712]/30 border-slate-800 text-center col-span-2 space-y-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Platform Rank</p>
            {attempt.rank !== null ? (
              <p className="text-base font-extrabold text-slate-200">
                Rank: <strong className="text-brand-400 font-black">{attempt.rank}</strong>
              </p>
            ) : (
              <p className="text-[9px] text-slate-500 font-semibold italic mt-1 leading-snug">Rank will sync after 2+ attempts.</p>
            )}
          </div>

          <div className="glass-card p-4 bg-[#030712]/30 border-slate-800 text-center col-span-2 space-y-1">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Platform Percentile</p>
            {attempt.percentile !== null ? (
              <p className="text-base font-extrabold text-slate-200">
                Percentile: <strong className="text-purple-400 font-black">{attempt.percentile}%</strong>
              </p>
            ) : (
              <p className="text-[9px] text-slate-500 font-semibold italic mt-1 leading-snug">Percentile will sync after 2+ attempts.</p>
            )}
          </div>
        </div>

        {/* Detailed Question Status counters */}
        <div className="glass-card p-4 bg-dark-900/20 border-slate-800/60 flex justify-around items-center text-center">
          <div>
            <p className="text-emerald-400 text-lg font-black">{attempt.correctCount ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Correct</p>
          </div>
          <div className="border-l border-slate-850 h-6"></div>
          <div>
            <p className="text-rose-400 text-lg font-black">{attempt.incorrectCount ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Incorrect</p>
          </div>
          <div className="border-l border-slate-850 h-6"></div>
          <div>
            <p className="text-slate-400 text-lg font-black">{attempt.skippedCount ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Skipped</p>
          </div>
        </div>

        {/* 2. Feedback diagnosis card */}
        {feedback && (
          <div className="glass-card p-6 border-brand-500/20 bg-brand-500/5 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiAward /> TargetRank Performance Feedback
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Diagnosing attempt velocity, negative marking penalties, and revision tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <p className="text-slate-300 font-medium leading-relaxed">
                  <strong className="text-slate-200 uppercase font-black text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded mr-1">Accuracy:</strong>
                  {feedback.accuracyFeedback}
                </p>
                <p className="text-slate-300 font-medium leading-relaxed">
                  <strong className="text-slate-200 uppercase font-black text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded mr-1">Pacing:</strong>
                  {feedback.timeManagement}
                </p>
                <p className="text-slate-300 font-medium leading-relaxed">
                  <strong className="text-slate-200 uppercase font-black text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded mr-1">Negative:</strong>
                  {feedback.negativeMarkingFeedback}
                </p>
              </div>

              <div className="bg-dark-950 border border-slate-850 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Recommended Actions</p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px] leading-normal">
                  {feedback.recommendedActions?.map((act, i) => <li key={i}>{act}</li>)}
                </ul>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 font-medium italic border-t border-slate-850 pt-2.5">
              💡 {feedback.encouragementMessage} (Note: This is simulated platform statistics and does not guarantee national exam results).
            </p>
          </div>
        )}

        {/* 3. Section performance table */}
        {sections.length > 0 && (
          <div className="glass-card bg-dark-900/30 border-slate-850 p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Section-wise breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-2.5">Section</th>
                    <th className="py-2.5 text-center">Questions</th>
                    <th className="py-2.5 text-center">Correct</th>
                    <th className="py-2.5 text-center">Incorrect</th>
                    <th className="py-2.5 text-center">Skipped</th>
                    <th className="py-2.5 text-center">Score</th>
                    <th className="py-2.5 text-center">Avg Time</th>
                    <th className="py-2.5 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-350 font-medium">
                  {sections.map((sec, idx) => (
                    <tr key={idx} className="hover:bg-dark-900/10">
                      <td className="py-3 font-bold text-white">{sec.sectionName}</td>
                      <td className="py-3 text-center text-slate-400">{sec.total}</td>
                      <td className="py-3 text-center text-emerald-400">{sec.correct}</td>
                      <td className="py-3 text-center text-rose-450">{sec.incorrect}</td>
                      <td className="py-3 text-center text-slate-500">{sec.skipped}</td>
                      <td className="py-3 text-center font-bold text-slate-200">{sec.score}</td>
                      <td className="py-3 text-center text-slate-400">{formatDuration(sec.timeSpentSeconds / (sec.total || 1))}</td>
                      <td className="py-3 text-right font-black text-brand-400">{sec.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Subject and Topic performance tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subjects */}
          <div className="glass-card bg-dark-900/30 border-slate-850 p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Subject Analysis</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-2">Subject</th>
                    <th className="py-2 text-center font-bold">Total</th>
                    <th className="py-2 text-center text-emerald-400">Correct</th>
                    <th className="py-2 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                  {subjects.map((sub, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-bold text-white">{sub.subjectName}</td>
                      <td className="py-2.5 text-center text-slate-400">{sub.total}</td>
                      <td className="py-2.5 text-center text-emerald-400">{sub.correct}</td>
                      <td className="py-2.5 text-right font-black text-brand-400">{sub.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Topics */}
          <div className="glass-card bg-dark-900/30 border-slate-850 p-6 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Topic Analysis</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-2">Topic</th>
                    <th className="py-2 text-center font-bold">Total</th>
                    <th className="py-2 text-center text-emerald-400">Correct</th>
                    <th className="py-2 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                  {topics.slice(0, 8).map((top, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-bold text-white">{top.topicName}</td>
                      <td className="py-2.5 text-center text-slate-400">{top.total}</td>
                      <td className="py-2.5 text-center text-emerald-400">{top.correct}</td>
                      <td className="py-2.5 text-right font-black text-purple-400">{top.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5. Detailed Question Review Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <FiBookOpen className="text-brand-400" /> Question & Answer Key Review
          </h3>

          <div className="space-y-4">
            {reviewedQuestions.map((q, idx) => {
              const isCorrect = q.status === 'correct';
              const isSkipped = q.status === 'skipped';

              let borderClass = 'border-slate-850 bg-dark-900/10';
              let badge = <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-extrabold uppercase">Skipped</span>;

              if (isCorrect) {
                borderClass = 'border-emerald-500/20 bg-emerald-500/5';
                badge = <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-extrabold uppercase">Correct</span>;
              } else if (!isSkipped) {
                borderClass = 'border-rose-500/20 bg-rose-500/5';
                badge = <span className="text-[9px] bg-rose-500/10 text-rose-450 px-2 py-0.5 rounded-full font-extrabold uppercase">Incorrect</span>;
              }

              return (
                <div key={idx} className={`glass-card p-6 border ${borderClass} space-y-4`}>
                  <div className="flex justify-between items-center gap-4 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">Question {q.questionOrder}</span>
                    <div className="flex items-center gap-2">
                      {badge}
                      <button
                        onClick={() => handleToggleBookmark(q.questionId)}
                        disabled={bookmarkingId === q.questionId}
                        className="text-slate-450 hover:text-amber-500 p-1 transition-all"
                        title="Save to bookmarks folder"
                      >
                        {q.isBookmarked ? <FiBookmark className="fill-current text-amber-500" /> : <FiBookmark />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, i) => {
                      const isSel = q.selectedAnswer === opt;
                      const isCorr = q.correctAnswer === opt;
                      
                      let optBorder = 'border-slate-850 text-slate-450';
                      if (isCorr) optBorder = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
                      else if (isSel) optBorder = 'border-rose-500 bg-rose-500/10 text-rose-300';

                      return (
                        <div key={i} className={`p-2.5 border rounded-lg text-xs leading-relaxed flex items-center gap-2 ${optBorder}`}>
                          <span className="w-4 h-4 rounded-full border border-current text-[9px] font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-3 bg-[#030712] border border-slate-850 rounded-xl text-[11px] text-slate-400 whitespace-pre-line leading-relaxed">
                      <strong className="text-slate-300 font-bold block mb-1">Explanation:</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
