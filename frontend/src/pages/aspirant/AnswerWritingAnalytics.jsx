import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiActivity, FiAward, FiAlertCircle, FiLoader, FiBookOpen,
  FiSliders, FiTrendingDown, FiClock, FiCheckSquare, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import answerWritingAPI from '../../api/answerWritingApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function AnswerWritingAnalytics() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await answerWritingAPI.getAnalytics();
      if (data.success) {
        setAnalytics(data);
      } else {
        setError('Failed to fetch analytics statistics.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Error retrieving descriptive practice analytics statistics.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Generating analytics scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Analytics Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not fetch descriptive statistics.'}</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="btn-primary text-xs px-4 py-2 mx-auto justify-center"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const { statusCounts = {} } = analytics;
  const inReviewCount = (statusCounts.submitted || 0) + (statusCounts.under_review || 0);

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiActivity className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Mains descriptive practice</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Answer Writing Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review aggregate descriptive grades, keyword averages, and syllabus coverage rates.
          </p>
        </div>

        {/* Layout Split Grid */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Answer Writing Analytics" />

          {/* Right Main workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Top statistics overview panels */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Total Submissions</p>
                <p className="text-2xl font-black text-white mt-0.5">{analytics.totalSubmissions}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">In Review</p>
                <p className="text-2xl font-black text-amber-450 mt-0.5">{inReviewCount}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Graded Answers</p>
                <p className="text-2xl font-black text-emerald-450 mt-0.5">{analytics.reviewedSubmissions}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Average Accuracy</p>
                <p className="text-2xl font-black text-brand-400 mt-0.5">{analytics.avgMarksPercentage}%</p>
              </div>
            </div>

            {/* Layout Column: Tables vs. Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Tables area */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Subject performance */}
                <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FiBookOpen className="text-brand-400" /> Subject Descriptive Grades
                  </h3>

                  {analytics.subjectPerformance?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4">No graded subject performance available yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] font-semibold text-slate-400">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5">Subject</th>
                            <th className="py-2.5 text-center">Practiced</th>
                            <th className="py-2.5 text-center">Reviewed</th>
                            <th className="py-2.5 text-center">Avg Score</th>
                            <th className="py-2.5 text-right">Average Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {analytics.subjectPerformance.map((sub, idx) => (
                            <tr key={idx} className="hover:bg-dark-950/20">
                              <td className="py-2.5 text-white font-extrabold">{sub.subjectName}</td>
                              <td className="py-2.5 text-center">{sub.total}</td>
                              <td className="py-2.5 text-center text-emerald-400">{sub.reviewed}</td>
                              <td className="py-2.5 text-center">{sub.reviewed > 0 ? `${sub.avgScore} / ${sub.avgMax}` : '-'}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{sub.avgPercentage}%</span>
                                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-brand-500 h-full" style={{ width: `${sub.avgPercentage}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Topic performance */}
                <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FiSliders className="text-brand-400" /> Topic Descriptive Grades
                  </h3>

                  {analytics.topicPerformance?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4">No graded topic performance available yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] font-semibold text-slate-400">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5">Topic</th>
                            <th className="py-2.5 text-center">Practiced</th>
                            <th className="py-2.5 text-center">Reviewed</th>
                            <th className="py-2.5 text-center">Avg Score</th>
                            <th className="py-2.5 text-right">Average Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {analytics.topicPerformance.map((top, idx) => (
                            <tr key={idx} className="hover:bg-dark-950/20">
                              <td className="py-2.5 text-white font-extrabold">{top.topicName}</td>
                              <td className="py-2.5 text-center">{top.total}</td>
                              <td className="py-2.5 text-center text-emerald-400">{top.reviewed}</td>
                              <td className="py-2.5 text-center">{top.reviewed > 0 ? `${top.avgScore} / ${top.avgMax}` : '-'}</td>
                              <td className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{top.avgPercentage}%</span>
                                  <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-brand-500 h-full" style={{ width: `${top.avgPercentage}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Insights and recent comments sidebar */}
              <div className="space-y-6">
                
                {/* Suggestions and next actions */}
                <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FiActivity className="text-brand-450" /> Suggested Action
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {analytics.suggestedNextAction}
                  </p>
                  <button
                    onClick={() => navigate('/aspirant/answer-writing')}
                    className="btn-primary w-full py-2.5 text-[10px] font-bold justify-center"
                  >
                    Practice Mains Questions <FiArrowRight />
                  </button>
                </div>

                {/* Weak subjects/topics warning card */}
                {(analytics.weakSubjects?.length > 0 || analytics.weakTopics?.length > 0) && (
                  <div className="glass-card p-5 border-rose-500/20 bg-rose-500/5 space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FiTrendingDown /> Mains Focus Areas (&lt;50% Score)
                    </h4>
                    
                    <div className="space-y-2 text-[10px] font-bold text-slate-400">
                      {analytics.weakSubjects?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase block">Weak Subjects</span>
                          <div className="flex flex-wrap gap-1">
                            {analytics.weakSubjects.map((s, i) => (
                              <span key={i} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded">
                                {s.subjectName} ({s.avgPercentage}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analytics.weakTopics?.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-500 uppercase block">Weak Topics</span>
                          <div className="flex flex-wrap gap-1">
                            {analytics.weakTopics.map((t, i) => (
                              <span key={i} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded">
                                {t.topicName} ({t.avgPercentage}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent mentor comments feedbacks */}
                <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Mentor Feedback</h4>
                  
                  {analytics.recentFeedback?.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No feedback remarks logged yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.recentFeedback.map((f, i) => (
                        <div
                          key={i}
                          onClick={() => navigate(`/aspirant/answer-writing/submissions/${f.submissionId}`)}
                          className="bg-dark-950/60 hover:bg-dark-900/40 transition-all p-3 rounded-xl border border-slate-850 cursor-pointer space-y-1.5"
                        >
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-slate-500">{new Date(f.reviewedAt).toLocaleDateString()}</span>
                            <span className="text-emerald-450">{f.marksAwarded} / {f.maxMarks} Marks</span>
                          </div>
                          <p className="text-[10px] font-extrabold text-slate-200 line-clamp-1">{f.questionText}</p>
                          <p className="text-[10px] text-slate-450 line-clamp-2 italic">"{f.overallFeedback}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
