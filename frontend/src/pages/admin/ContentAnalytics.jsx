import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity, FiTrendingUp, FiLoader, FiRefreshCw, FiBookOpen,
  FiAward, FiGrid, FiAlertCircle, FiTrendingDown, FiPieChart,
  FiUploadCloud, FiCheckCircle, FiChevronDown, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import contentAPI from '../../api/contentApi.js';

export default function ContentAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await contentAPI.intelligence.getStatistics();
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error('Failed to fetch statistics');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load content analytics.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Loading Content Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0d1117] border border-rose-500/20 rounded-2xl p-8 text-center space-y-4">
          <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Failed to Load</h2>
          <p className="text-xs text-slate-450">{error}</p>
          <button onClick={fetchStats} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto">
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  const s = stats || {};
  const maxWeeklyCount = s.questionGrowth?.length 
    ? Math.max(...s.questionGrowth.map(g => g.count), 1)
    : 1;

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <FiPieChart className="text-indigo-400" /> Content Analytics
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Visual growth tracker · Difficulty distribution · Solved question analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/content-health"
              className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <FiActivity /> Content Health
            </Link>
            <button onClick={fetchStats}
              className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        {/* Row 1: Weekly Growth + Import Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart (SVG Bar Chart) */}
          <div className="lg:col-span-2 bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <FiTrendingUp className="text-indigo-400" /> Weekly Question Growth
              </h3>
              <span className="text-[10px] text-slate-500 font-medium">Last 12 weeks</span>
            </div>
            
            {s.questionGrowth?.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-20">No question additions in the last 12 weeks.</p>
            ) : (
              <div className="flex items-end justify-between gap-2 h-48 pt-6 border-b border-slate-900 px-2">
                {s.questionGrowth.map((g, i) => {
                  const barPct = Math.round((g.count / maxWeeklyCount) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="text-[9px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                        {g.count}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600/30 to-indigo-500 hover:to-indigo-400 rounded-t-sm transition-all duration-500" 
                        style={{ height: `${barPct}%` }}
                      />
                      <div className="text-[9px] font-mono text-slate-500 select-none">
                        W{g._id.week}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Import Summary */}
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <FiUploadCloud className="text-indigo-400" /> Import statistics
            </h3>
            <div className="space-y-3.5 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Batches</span>
                <span className="font-bold text-white font-mono">{s.importSummary?.totalBatches || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Rows Processed</span>
                <span className="font-bold text-white font-mono">{s.importSummary?.totalRows || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Successfully Imported</span>
                <span className="font-bold text-emerald-400 font-mono">{s.importSummary?.imported || 0}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Failed / Invalid Rows</span>
                <span className="font-bold text-rose-400 font-mono">{s.importSummary?.failed || 0}</span>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-wider">
                  <span>Import Success Rate</span>
                  <span>
                    {s.importSummary?.totalRows 
                      ? Math.round((s.importSummary.imported / s.importSummary.totalRows) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ 
                      width: `${s.importSummary?.totalRows 
                        ? (s.importSummary.imported / s.importSummary.totalRows) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Difficulty Distribution by Subject */}
        <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
            <FiBookOpen className="text-indigo-400" /> Difficulty Distribution by Subject
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {s.difficultyBySubject?.length === 0 ? (
              <p className="text-slate-500 text-xs py-5 col-span-2 text-center">No subject question distribution data.</p>
            ) : s.difficultyBySubject?.map((sub, idx) => {
              const total = sub.easy + sub.medium + sub.hard || 1;
              const easyPct = Math.round((sub.easy / total) * 100);
              const medPct = Math.round((sub.medium / total) * 100);
              const hardPct = Math.round((sub.hard / total) * 100);

              return (
                <div key={idx} className="space-y-2 p-4 bg-[#080d13] border border-slate-900 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">{sub.subjectName}</span>
                    <span className="text-[10px] font-mono text-slate-500">{total} Qs</span>
                  </div>
                  {/* Tri-color progress bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${easyPct}%` }} title={`Easy: ${easyPct}%`} />
                    <div className="bg-amber-500 h-full" style={{ width: `${medPct}%` }} title={`Medium: ${medPct}%`} />
                    <div className="bg-rose-500 h-full" style={{ width: `${hardPct}%` }} title={`Hard: ${hardPct}%`} />
                  </div>
                  {/* Legend */}
                  <div className="flex gap-4 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Easy {easyPct}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Medium {medPct}%</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Hard {hardPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 3: Solved Questions & Accuracy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Solved */}
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
              <FiTrendingUp className="text-emerald-450" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top 10 Most Solved Questions</h3>
            </div>
            <div className="divide-y divide-slate-900">
              {s.topSolvedQuestions?.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-10">No practice attempts recorded yet.</p>
              ) : s.topSolvedQuestions?.map((q, i) => (
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs text-slate-300 leading-normal line-clamp-2">{q.questionText}...</p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-800 text-slate-400">
                      {q.difficulty}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 select-none">
                    {q.solveCount || 0} attempts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Least Solved */}
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
              <FiTrendingDown className="text-rose-455" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">10 Least Solved Questions</h3>
            </div>
            <div className="divide-y divide-slate-900">
              {s.leastSolvedQuestions?.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-10">No questions available.</p>
              ) : s.leastSolvedQuestions?.map((q, i) => (
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs text-slate-300 leading-normal line-clamp-2">{q.questionText}...</p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-slate-800 text-slate-400">
                      {q.difficulty}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-rose-400 shrink-0 select-none">
                    {q.solveCount || 0} attempts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
