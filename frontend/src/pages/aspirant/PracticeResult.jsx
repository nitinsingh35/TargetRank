import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiAward, FiCheck, FiX, FiClock, FiPercent, FiArrowRight,
  FiBookOpen, FiSliders, FiBookmark, FiList, FiAlertCircle, FiLoader
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import practiceAPI from '../../api/practiceApi.js';

export default function PracticeResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookmarkingId, setBookmarkingId] = useState(null);

  useEffect(() => {
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchResult = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: resData } = await practiceAPI.getSessionResult(sessionId);
      if (resData.success) {
        setData(resData);
      } else {
        setError('Failed to fetch practice result scorecard.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Results are not available. This session might not be submitted yet.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (questionId) => {
    setBookmarkingId(questionId);
    try {
      const { data: bookmarkRes } = await practiceAPI.bookmarkQuestion(sessionId, { questionId });
      toast.success(bookmarkRes.isBookmarked ? 'Question bookmarked!' : 'Bookmark removed.');
      
      // Update local state
      setData(prev => {
        if (!prev) return prev;
        const updatedQuestions = prev.questions.map(q => 
          q.questionId === questionId ? { ...q, isBookmarked: bookmarkRes.isBookmarked } : q
        );
        return { ...prev, questions: updatedQuestions };
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
    if (m > 0) {
      return `${m}m ${r}s`;
    }
    return `${r}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Generating your scorecard...</p>
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
            <h2 className="text-lg font-bold text-white">Oops! Access Issue</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Scorecard is not available.'}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/aspirant/practice-history" className="btn-secondary text-xs px-4 py-2">
              <FiClock className="mr-1" /> Practice History
            </Link>
            <button onClick={fetchResult} className="btn-primary text-xs px-4 py-2">
              Retry Load
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { summary = {}, subjectPerformance = [], topicPerformance = [], weakTopics = [], questions = [] } = data;

  // Resolve Weak Topics details using topicPerformance lookup
  const weakTopicsList = (weakTopics || []).map(wtId => {
    const wtIdStr = typeof wtId === 'object' && wtId._id ? wtId._id.toString() : wtId.toString();
    const perf = topicPerformance.find(t => (t.topicId?._id || t.topicId)?.toString() === wtIdStr);
    return {
      topicId: wtIdStr,
      topicName: perf?.topicName || 'General Concept',
      accuracy: perf?.accuracy ?? 0,
    };
  });

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Link to="/aspirant/practice-history" className="hover:text-brand-400 transition-colors flex items-center gap-1">
            <FiList className="text-[10px]" /> Practice History
          </Link>
          <span>/</span>
          <span className="text-slate-400">Scorecard Analysis</span>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <FiAward className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Practice Scorecard</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Review parameters, analysis targets, and incorrect items added to revision stacks.
            </p>
          </div>
        </div>

        {/* 1. Top Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Practice Score</p>
            <p className="text-2xl font-extrabold text-white">
              {summary.score ?? 0} <span className="text-xs text-slate-500 font-bold">/ {summary.totalMarks ?? 0}</span>
            </p>
            <p className="text-[9px] font-semibold text-slate-550">Marks Secured</p>
          </div>

          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Accuracy</p>
            <p className="text-2xl font-extrabold text-brand-400 flex items-center justify-center gap-0.5">
              <FiPercent className="text-xs shrink-0" /> {summary.accuracy ?? 0}%
            </p>
            <p className="text-[9px] font-semibold text-slate-550">On attempted items</p>
          </div>

          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Time Spent</p>
            <p className="text-2xl font-extrabold text-slate-300 flex items-center justify-center gap-1.5">
              <FiClock className="text-sm shrink-0 text-slate-500" /> {formatDuration(summary.timeTakenSeconds)}
            </p>
            <p className="text-[9px] font-semibold text-slate-550">
              Session Duration
            </p>
          </div>

          <div className="glass-card p-5 bg-dark-900/40 border-slate-800 text-center space-y-1 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Status</p>
            <div className="flex justify-center">
              {summary.autoSubmitted ? (
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Auto Submitted
                </span>
              ) : (
                <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Manual Submitted
                </span>
              )}
            </div>
            <p className="text-[9px] font-semibold text-slate-550 mt-1.5">
              Total questions: {questions.length}
            </p>
          </div>
        </div>

        {/* Selection Summary (Smart selection metadata analysis) */}
        {data.selectionSummary && (
          <div className="glass-card p-6 bg-dark-900/35 border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Practice Setup Question Mix</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Details on the question types, difficulty, and syllabus areas balanced for this session.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Question source mix */}
              <div className="bg-[#030712] border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Question Sources</p>
                <div className="space-y-1">
                  {Object.entries(data.selectionSummary.sourceDistribution || {}).map(([src, count]) => {
                    const total = data.selectionSummary.selectedCount || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={src} className="flex justify-between text-xs font-semibold text-slate-355 capitalize">
                        <span>{src.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-white">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty mix */}
              <div className="bg-[#030712] border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Difficulty Distribution</p>
                <div className="space-y-1">
                  {Object.entries(data.selectionSummary.difficultyDistribution || {}).map(([diff, count]) => {
                    const total = data.selectionSummary.selectedCount || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={diff} className="flex justify-between text-xs font-semibold text-slate-355 capitalize">
                        <span>{diff}</span>
                        <span className="font-bold text-white">{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Subject distribution */}
              <div className="bg-[#030712] border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Subjects Breakdown</p>
                <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                  {Object.entries(data.selectionSummary.subjectDistribution || {}).map(([sub, count]) => (
                    <div key={sub} className="flex justify-between text-xs font-semibold text-slate-355">
                      <span className="truncate max-w-[120px]">{sub}</span>
                      <span className="font-bold text-white">{count} Qs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Topic distribution */}
              <div className="bg-[#030712] border border-slate-800 p-4 rounded-xl space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Topics Distribution</p>
                <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                  {Object.entries(data.selectionSummary.topicDistribution || {}).map(([top, count]) => (
                    <div key={top} className="flex justify-between text-xs font-semibold text-slate-355">
                      <span className="truncate max-w-[120px]">{top}</span>
                      <span className="font-bold text-white">{count} Qs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning badge if selected count is lower than requested count */}
            {data.selectionSummary.selectedCount < data.selectionSummary.requestedCount && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <FiAlertCircle className="text-sm shrink-0" />
                <span>This session started with {data.selectionSummary.selectedCount} questions instead of the recommended {data.selectionSummary.requestedCount} due to limited verified questions matching your filters.</span>
              </div>
            )}
          </div>
        )}

        {/* Detailed counts */}
        <div className="glass-card p-4 bg-dark-900/20 border-slate-800/60 flex justify-around items-center text-center">
          <div>
            <p className="text-emerald-400 text-lg font-black">{summary.correctCount ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Correct</p>
          </div>
          <div className="border-l border-slate-800 h-6"></div>
          <div>
            <p className="text-rose-400 text-lg font-black">{summary.incorrectCount ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Incorrect</p>
          </div>
          <div className="border-l border-slate-800 h-6"></div>
          <div>
            <p className="text-slate-400 text-lg font-black">{summary.skippedCount ?? 0}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Skipped</p>
          </div>
        </div>

        {/* 2. Subject-Wise Performance */}
        <div className="glass-card bg-dark-900/30 border-slate-800 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Subject-Wise Performance</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Accuracies and marks breakdown per subject syllabus area.</p>
          </div>
          {subjectPerformance.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No subject data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-2.5 pb-3">Subject</th>
                    <th className="py-2.5 pb-3 text-center">Total</th>
                    <th className="py-2.5 pb-3 text-center">Correct</th>
                    <th className="py-2.5 pb-3 text-center">Incorrect</th>
                    <th className="py-2.5 pb-3 text-center">Skipped</th>
                    <th className="py-2.5 pb-3 text-center">Score</th>
                    <th className="py-2.5 pb-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                  {subjectPerformance.map((sub, idx) => (
                    <tr key={idx} className="hover:bg-dark-900/10">
                      <td className="py-3 font-bold text-white">{sub.subjectName}</td>
                      <td className="py-3 text-center text-slate-400">{sub.total}</td>
                      <td className="py-3 text-center text-emerald-400">{sub.correct}</td>
                      <td className="py-3 text-center text-rose-400">{sub.incorrect}</td>
                      <td className="py-3 text-center text-slate-500">{sub.skipped}</td>
                      <td className="py-3 text-center font-bold">{sub.score}</td>
                      <td className="py-3 text-right font-black text-brand-400">{sub.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. Topic-Wise Performance */}
        <div className="glass-card bg-dark-900/30 border-slate-800 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Topic-Wise Performance</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Granular accuracies breakdown per syllabus topic.</p>
          </div>
          {topicPerformance.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No topic data found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-2.5 pb-3">Topic</th>
                    <th className="py-2.5 pb-3 text-center">Total</th>
                    <th className="py-2.5 pb-3 text-center">Correct</th>
                    <th className="py-2.5 pb-3 text-center">Incorrect</th>
                    <th className="py-2.5 pb-3 text-center">Skipped</th>
                    <th className="py-2.5 pb-3 text-center">Score</th>
                    <th className="py-2.5 pb-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                  {topicPerformance.map((top, idx) => (
                    <tr key={idx} className="hover:bg-dark-900/10">
                      <td className="py-3 font-bold text-white">{top.topicName}</td>
                      <td className="py-3 text-center text-slate-400">{top.total}</td>
                      <td className="py-3 text-center text-emerald-400">{top.correct}</td>
                      <td className="py-3 text-center text-rose-400">{top.incorrect}</td>
                      <td className="py-3 text-center text-slate-500">{top.skipped}</td>
                      <td className="py-3 text-center font-bold">{top.score}</td>
                      <td className="py-3 text-right font-black text-brand-400">{top.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Weak Topics Card */}
        {weakTopicsList.length > 0 && (
          <div className="glass-card p-6 border-amber-500/20 bg-amber-500/5 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiAlertCircle /> Weak Concept Areas Detected
              </h3>
              <p className="text-[10px] text-amber-500/80 mt-0.5">
                Topics with low accuracy (less than 50% on multiple attempts). Focus extra prep time here.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {weakTopicsList.map((wt, idx) => (
                <div key={idx} className="p-4 bg-dark-950/80 border border-slate-800 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-white">{wt.topicName}</p>
                  <p className="text-[10px] text-rose-400 font-extrabold">Accuracy: {wt.accuracy}%</p>
                  <p className="text-[10px] text-slate-400 italic">Practice more questions from this topic.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Suggested Next Actions */}
        <div className="glass-card p-6 border-slate-800/80 bg-dark-900/10 space-y-4">
          <div>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Suggested Next Actions</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Recommended steps to build on these practice results.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => navigate('/aspirant/smart-practice')}
              className="btn-primary py-2.5 px-4 text-xs font-bold"
            >
              Start Another Practice Session
            </button>
            
            {weakTopicsList.length > 0 && (
              <button
                onClick={() => navigate('/aspirant/smart-practice', { state: { weakTopicsFilter: weakTopicsList.map(w => w.topicId) } })}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md text-xs active:scale-95 flex items-center gap-1"
              >
                Retry Weak Topics
              </button>
            )}

            <button
              onClick={() => navigate('/aspirant/smart-practice')}
              className="btn-secondary py-2.5 px-4 text-xs font-bold border-slate-800"
            >
              <FiSliders /> Go to Smart Practice
            </button>

            <button
              onClick={() => navigate('/aspirant/practice-history')}
              className="btn-secondary py-2.5 px-4 text-xs font-bold border-slate-800"
            >
              <FiList /> Go to Practice History
            </button>

            <button
              onClick={() => navigate('/aspirant/mistake-notebook')}
              className="btn-secondary py-2.5 px-4 text-xs font-bold border-slate-800"
            >
              <FiBookOpen /> Mistake Notebook
            </button>
          </div>
        </div>

        {/* 6. Question Review Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <FiBookOpen className="text-brand-400" /> Question & Answer Key Review
          </h3>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const qIdStr = q.questionId;
              const isCorrect = q.status === 'correct';
              const isSkipped = q.status === 'skipped';

              let cardBorder = 'border-slate-800';
              let badge = null;
              let marksWord = `0.00`;

              if (isCorrect) {
                cardBorder = 'border-emerald-500/20 bg-emerald-500/5';
                badge = <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Correct</span>;
                marksWord = `+${q.marks}`;
              } else if (isSkipped) {
                cardBorder = 'border-slate-800/80 bg-dark-900/20';
                badge = <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Skipped</span>;
              } else {
                cardBorder = 'border-rose-500/20 bg-rose-500/5';
                badge = <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded-full font-extrabold uppercase">Incorrect</span>;
                marksWord = `-${q.negativeMarks}`;
              }

              return (
                <div key={idx} className={`glass-card p-6 border transition-all ${cardBorder} space-y-4`}>
                  
                  {/* Item top stats */}
                  <div className="flex justify-between items-center flex-wrap gap-2 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">QUESTION {idx + 1}</span>
                      {badge}
                      <span className="text-[10px] text-slate-500 font-bold bg-dark-950 px-2 py-0.5 rounded">
                        Marks earned: {marksWord}
                      </span>
                    </div>

                    {/* Bookmark Toggle */}
                    <button
                      onClick={() => handleToggleBookmark(qIdStr)}
                      disabled={bookmarkingId === qIdStr}
                      className={`p-2 rounded-lg border transition-all ${
                        q.isBookmarked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-dark-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={q.isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                    >
                      {bookmarkingId === qIdStr ? (
                        <FiLoader className="text-sm animate-spin" />
                      ) : (
                        <FiBookmark className={`text-sm ${q.isBookmarked ? 'fill-current' : ''}`} />
                      )}
                    </button>
                  </div>

                  {/* Question Text */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                    {q.questionText}
                  </p>

                  {/* Subject and Topic Chips */}
                  <div className="flex gap-1.5 flex-wrap text-[10px] font-bold text-slate-400">
                    <span className="bg-slate-800/50 border border-slate-700/50 px-2 py-0.5 rounded">
                      Subject: {q.subject || 'GS'}
                    </span>
                    <span className="bg-slate-800/30 border border-slate-700/30 px-2 py-0.5 rounded">
                      Topic: {q.topic || 'General'}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options?.map((opt, oidx) => {
                      const optionVal = typeof opt === 'string' ? opt : opt.text;
                      const isCorrectOpt = optionVal === q.correctAnswer;
                      const isSelectedOpt = optionVal === q.selectedAnswer;

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
                            <span>
                              {typeof opt === 'string' ? opt : (
                                <div>
                                  <div>{opt.text}</div>
                                  {opt.textHindi && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{opt.textHindi}</div>}
                                </div>
                              )}
                            </span>
                          </div>
                          {isCorrectOpt && <FiCheck className="text-emerald-400 shrink-0 text-xs" />}
                          {isSelectedOpt && !isCorrectOpt && <FiX className="text-rose-400 shrink-0 text-xs" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Solutions / Explanation */}
                  {q.explanation && (
                    <div className="p-4 bg-dark-950/40 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                      <strong className="text-slate-300 font-bold block mb-1">Explanation:</strong>
                      {q.explanation}
                    </div>
                  )}

                  {/* notes stack & practice similar questions trigger */}
                  <div className="space-y-3 pt-2 border-t border-slate-850/50">
                    {!isCorrect && !isSkipped && (
                      <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5 text-xs text-rose-400">
                        <span>This question is added to your Mistake Notebook.</span>
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
                        <span>This question is bookmarked.</span>
                        <button
                          onClick={() => navigate('/aspirant/bookmarks')}
                          className="bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-450 font-bold px-3 py-1.5 rounded-lg transition-all text-[10px]"
                        >
                          View Bookmarks
                        </button>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Personal Notes
                      </label>
                      <textarea
                        disabled
                        value="Personal notes can be added/edited during spaced revision sessions."
                        className="w-full bg-dark-950 border border-slate-850 rounded-xl px-3 py-2 text-[11px] text-slate-550 select-none resize-none h-14"
                      />
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
