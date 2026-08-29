import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiAward, FiUsers, FiBarChart2, FiAlertCircle,
  FiTrendingUp, FiClock, FiPercent, FiArrowLeft, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';
import AdminSidebar from './AdminSidebar.jsx';

const StatCard = ({ icon: Icon, label, value, sub, color = 'text-white' }) => (
  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`text-lg ${color}`} />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

export default function PYQPaperAnalytics() {
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paperRes, analyticsRes] = await Promise.all([
        pyqAPI.adminGetPYQPaper(id),
        pyqAPI.adminGetAnalytics(id),
      ]);
      setPaper(paperRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val, decimals = 1) =>
    val === undefined || val === null ? '—' : Number(val).toFixed(decimals);

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBarChart2 className="text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {paper ? paper.title : 'PYQ Paper Analytics'}
            </h1>
            {paper && (
              <p className="text-slate-500 text-sm mt-0.5">
                {paper.examId?.title} · {paper.year} · {paper.paperName}
              </p>
            )}
          </div>
          <Link
            to="/admin/pyq-papers"
            className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-slate-700 hover:bg-dark-700 text-slate-300 text-sm rounded-xl transition-all"
          >
            <FiArrowLeft /> Back
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar active="PYQ Papers" />

          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !analytics ? (
              <div className="text-center py-16 text-slate-500">No analytics data available.</div>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon={FiUsers} label="Total Attempts" value={analytics.totalAttempts || 0} color="text-blue-400" />
                  <StatCard icon={FiCheckCircle} label="Completed" value={analytics.submittedAttempts || 0} color="text-emerald-400" />
                  <StatCard icon={FiTrendingUp} label="Avg Score" value={`${fmt(analytics.avgScore)}%`} color="text-amber-400" />
                  <StatCard icon={FiClock} label="Avg Time" value={`${fmt(analytics.avgTimeTaken, 0)} min`} color="text-indigo-400" />
                </div>

                {/* Score Distribution */}
                {analytics.scoreDistribution && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4">Score Distribution</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.scoreDistribution).map(([range, count]) => {
                        const total = Object.values(analytics.scoreDistribution).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={range} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-20 shrink-0">{range}%</span>
                            <div className="flex-1 bg-slate-800 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-300 w-12 text-right">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Most Incorrectly Answered Questions */}
                {analytics.mostIncorrectQuestions?.length > 0 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <FiAlertCircle className="text-rose-400" /> Most Incorrectly Answered Questions
                    </h3>
                    <div className="space-y-2">
                      {analytics.mostIncorrectQuestions.slice(0, 10).map((q, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-dark-800 rounded-xl">
                          <span className="text-xs text-slate-600 w-5 shrink-0 text-right">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 line-clamp-2">{q.questionText}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{q.subjectId?.title}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-rose-400">{fmt(q.errorRate)}%</p>
                            <p className="text-[10px] text-slate-500">error rate</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topper Comparison */}
                {analytics.topperComparison && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <FiPercent className="text-amber-400" /> Score Benchmarks
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ['Top 10%', analytics.topperComparison.top10Percent, 'text-emerald-400'],
                        ['Top 25%', analytics.topperComparison.top25Percent, 'text-blue-400'],
                        ['Median', analytics.topperComparison.median, 'text-amber-400'],
                        ['Lowest 25%', analytics.topperComparison.bottom25Percent, 'text-rose-400'],
                      ].map(([label, val, color]) => (
                        <div key={label} className="bg-dark-800 rounded-xl p-3 text-center">
                          <p className={`text-xl font-black ${color}`}>{fmt(val)}%</p>
                          <p className="text-[10px] text-slate-500 mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Attempts */}
                {analytics.recentAttempts?.length > 0 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-800">
                      <h3 className="text-sm font-bold text-white">Recent Attempts</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Aspirant</th>
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Score</th>
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Time Taken</th>
                            <th className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {analytics.recentAttempts.slice(0, 10).map((attempt, idx) => (
                            <tr key={idx} className="hover:bg-dark-800/30 transition-colors">
                              <td className="px-4 py-2.5 text-xs text-slate-300">{attempt.userId?.name || 'Aspirant'}</td>
                              <td className="px-4 py-2.5 text-xs font-semibold text-amber-400">{fmt(attempt.scorePercentage)}%</td>
                              <td className="px-4 py-2.5 text-xs text-slate-400">{attempt.timeTakenMinutes ? `${attempt.timeTakenMinutes} min` : '—'}</td>
                              <td className="px-4 py-2.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  attempt.status === 'submitted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {attempt.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
