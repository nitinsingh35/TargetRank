import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp, FiAward, FiBarChart2, FiCalendar,
  FiArrowUp, FiArrowDown, FiMinus
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

function ScoreBar({ label, value, max, color = 'bg-amber-500' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-400 truncate max-w-[70%]">{label}</p>
        <p className="text-xs font-bold text-white">{Math.round(value)}%</p>
      </div>
      <div className="h-2 bg-slate-800 rounded-full">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TrendDot({ value, prev }) {
  if (!prev || !value) return <FiMinus className="text-slate-500 text-xs" />;
  const diff = value - prev;
  if (diff > 0) return <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-semibold"><FiArrowUp />+{diff.toFixed(1)}%</span>;
  if (diff < 0) return <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-semibold"><FiArrowDown />{diff.toFixed(1)}%</span>;
  return <FiMinus className="text-slate-500 text-xs" />;
}

export default function PYQComparison() {
  const [comparison, setComparison] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExam, setFilterExam] = useState('');

  useEffect(() => {
    loadExams();
    loadComparison();
  }, []);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) { console.error(err); }
  };

  const loadComparison = async (examId) => {
    setLoading(true);
    try {
      const params = {};
      if (examId) params.examId = examId;
      const { data } = await pyqAPI.getMyComparison(params);
      setComparison(data);
    } catch (err) {
      toast.error('Failed to load comparison data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (examId) => {
    setFilterExam(examId);
    loadComparison(examId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const attempts = comparison?.attempts || [];
  const subjectTrends = comparison?.subjectTrends || [];
  const yearWise = comparison?.yearWise || [];
  const overall = comparison?.overall || {};

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiTrendingUp className="text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">PYQ Progress & Comparison</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your performance across all previous year question papers.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <RevisionSidebar active="PYQ Comparison" />

          <div className="flex-1 space-y-6">

            {/* Exam Filter */}
            <div className="flex items-center gap-2">
              <select
                value={filterExam}
                onChange={e => handleFilter(e.target.value)}
                className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
              >
                <option value="">All Exams</option>
                {exams.map(e => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
            </div>

            {attempts.length === 0 ? (
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
                <FiAward className="text-5xl text-slate-700 mx-auto" />
                <p className="text-slate-400 font-semibold">No PYQ attempts yet.</p>
                <p className="text-slate-600 text-sm">Complete at least one PYQ paper to see your progress here.</p>
                <Link
                  to="/aspirant/pyq-papers"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20"
                >
                  <FiAward /> Browse PYQ Papers
                </Link>
              </div>
            ) : (
              <>
                {/* Overall Stats */}
                {overall && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Attempts', value: overall.totalAttempts || 0, color: 'text-blue-400' },
                      { label: 'Avg Score', value: `${Math.round(overall.avgScore || 0)}%`, color: 'text-amber-400' },
                      { label: 'Best Score', value: `${Math.round(overall.bestScore || 0)}%`, color: 'text-emerald-400' },
                      { label: 'Papers Done', value: overall.uniquePapers || 0, color: 'text-indigo-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Score Over Time Chart (Simple Bar) */}
                {attempts.length > 1 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <FiBarChart2 className="text-amber-400" /> Score Trend
                    </h2>
                    <div className="flex items-end gap-2 h-32 overflow-x-auto pb-2">
                      {attempts.slice(-12).map((a, idx, arr) => {
                        const pct = a.scorePercentage || 0;
                        const prev = arr[idx - 1]?.scorePercentage;
                        const barColor = pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                        return (
                          <div key={a._id} className="flex flex-col items-center gap-1 min-w-[40px]">
                            <p className="text-[9px] text-slate-500 font-bold">{Math.round(pct)}%</p>
                            <div
                              className={`w-8 rounded-t-md transition-all ${barColor} relative group`}
                              style={{ height: `${Math.max(4, pct)}%` }}
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark-700 border border-slate-600 text-[10px] text-white px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {a.paperTitle || 'Paper'}<br />{Math.round(pct)}%
                              </div>
                            </div>
                            <TrendDot value={pct} prev={prev} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Year-Wise Breakdown */}
                {yearWise.length > 0 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <FiCalendar className="text-amber-400" /> Year-Wise Paper Progress
                    </h2>
                    <div className="space-y-2.5">
                      {yearWise.map(y => (
                        <ScoreBar
                          key={y.year}
                          label={`${y.year} (${y.attempts} attempt${y.attempts !== 1 ? 's' : ''})`}
                          value={y.avgScore}
                          max={100}
                          color={y.avgScore >= 60 ? 'bg-emerald-500' : y.avgScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Subject-Wise Trends */}
                {subjectTrends.length > 0 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <FiBarChart2 className="text-indigo-400" /> Subject Accuracy (Across All PYQ Attempts)
                    </h2>
                    <div className="space-y-2.5">
                      {subjectTrends.map(sub => (
                        <ScoreBar
                          key={sub.subject}
                          label={`${sub.subject} (${sub.correct}/${sub.total} correct)`}
                          value={sub.accuracy}
                          max={100}
                          color={sub.accuracy >= 60 ? 'bg-emerald-500' : sub.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500'}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Attempt History Table */}
                <div className="bg-dark-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white">Attempt History</h2>
                    <Link to="/aspirant/pyq-attempt-history" className="text-xs text-amber-400 hover:text-amber-300">View All →</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Paper</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Year</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Score</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Correct</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Time</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {attempts.slice(0, 10).map((a, idx, arr) => {
                          const prev = arr[idx + 1];
                          return (
                            <tr key={a._id} className="hover:bg-dark-800/30 transition-colors">
                              <td className="px-4 py-2.5">
                                <p className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">{a.paperTitle}</p>
                                <p className="text-[10px] text-slate-500">{a.examTitle}</p>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-slate-400">{a.year}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-amber-400">{Math.round(a.scorePercentage || 0)}%</span>
                                  <TrendDot value={a.scorePercentage} prev={prev?.scorePercentage} />
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-emerald-400 font-semibold">{a.correct}/{a.totalQuestions}</td>
                              <td className="px-4 py-2.5 text-xs text-slate-400">{a.timeTakenMinutes ? `${a.timeTakenMinutes}min` : '—'}</td>
                              <td className="px-4 py-2.5">
                                <Link to={`/aspirant/pyq-papers/attempt/${a._id}/result`} className="text-[11px] text-amber-400 hover:text-amber-300">
                                  Review →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
