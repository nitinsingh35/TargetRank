import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertTriangle, FiCheckCircle, FiLoader, FiRefreshCw,
  FiBookOpen, FiFileText, FiAward, FiActivity, FiGrid,
  FiAlertCircle, FiTrendingDown, FiTrendingUp, FiChevronDown,
  FiChevronRight, FiDownload, FiSearch, FiFilter, FiAlertOctagon
} from 'react-icons/fi';
import { MdOutlineAutoGraph } from 'react-icons/md';
import toast from 'react-hot-toast';
import AdminSidebar from './AdminSidebar.jsx';
import contentAPI from '../../api/contentApi.js';

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, label, value, sub, color = 'text-white', bg = 'bg-[#0d1117]', accent }) => (
  <div className={`${bg} border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-1 relative overflow-hidden`}>
    {accent && <div className={`absolute top-0 left-0 w-full h-0.5 ${accent}`} />}
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <Icon className={`text-base ${color} opacity-60`} />
    </div>
    <span className={`text-2xl font-black mt-1 ${color}`}>{value}</span>
    {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
  </div>
);

/* ── Coverage Bar ── */
const CoverageBar = ({ pct }) => {
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 30 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-900 rounded-full h-1.5 overflow-hidden">
        <div className={`${color} h-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono font-bold text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
};

/* ── Missing Badge ── */
const MissingBadge = ({ label }) => (
  <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">
    {label}
  </span>
);

export default function ContentHealth() {
  const [health, setHealth]       = useState(null);
  const [missing, setMissing]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filterMissing, setFilter] = useState('all');
  const [expandMissing, setExpandMissing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [h, m] = await Promise.all([
        contentAPI.intelligence.getHealth(),
        contentAPI.intelligence.getMissingContent(),
      ]);
      if (h.data.success) setHealth(h.data.health);
      if (m.data.success) setMissing(m.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load content health data.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* filter the missing content report */
  const filteredReport = (missing?.report || []).filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.examTitle?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterMissing === 'all'
      || t.missing.includes(filterMissing);
    return matchSearch && matchFilter;
  });

  /* download missing report as CSV */
  const downloadCSV = () => {
    const header = 'Topic,Exam,Subject,Questions,Tutorials,PYQs,Interview,Missing\n';
    const rows = (missing?.report || []).map(t =>
      `"${t.title}","${t.examTitle}","${t.subject}",${t.questions},${t.tutorials},${t.pyqs},${t.interview},"${t.missing.join(' / ')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'missing_content_report.csv';
    document.body.appendChild(a); a.click(); a.remove();
    toast.success('Report downloaded!');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <FiLoader className="text-4xl text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold">Loading Content Health Dashboard…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0d1117] border border-rose-500/20 rounded-2xl p-8 text-center space-y-4">
        <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">Failed to Load</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button onClick={fetchAll} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto">
          <FiRefreshCw /> Retry
        </button>
      </div>
    </div>
  );

  const h = health || {};

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <FiActivity className="text-indigo-400" /> Content Health Dashboard
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Real-time syllabus coverage · Missing content detector · Topic health
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/content-analytics"
              className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <MdOutlineAutoGraph /> Analytics
            </Link>
            <button onClick={fetchAll}
              className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        {/* ── Stat Cards Row 1 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={FiGrid}          label="Total Questions"          value={h.totalQuestions?.toLocaleString() || 0}    accent="bg-indigo-500" />
          <StatCard icon={FiCheckCircle}   label="Coverage %"               value={`${h.coveragePct || 0}%`}                    color="text-emerald-400" accent="bg-emerald-500" />
          <StatCard icon={FiAlertTriangle} label="Missing Topics"            value={h.missingTopics || 0}                        color="text-rose-400" accent="bg-rose-500" />
          <StatCard icon={FiTrendingDown}  label="Low Coverage Topics"       value={h.lowCoverageTopics || 0}                    color="text-amber-400" accent="bg-amber-500" />
        </div>

        {/* ── Stat Cards Row 2 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={FiBookOpen}      label="Subjects w/ No Questions"  value={h.subjectsWithNoQuestions || 0}              color="text-orange-400" />
          <StatCard icon={FiAlertOctagon}  label="Pending Review"            value={h.pendingReview || 0}                        color="text-yellow-400" />
          <StatCard icon={FiActivity}      label="Recently Added (7d)"       value={h.recentlyAdded || 0}                        color="text-sky-400" />
          <StatCard icon={FiRefreshCw}     label="Recently Updated (7d)"     value={h.recentlyUpdated || 0}                      color="text-violet-400" />
        </div>

        {/* ── Top / Least Used Topics ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Top Used */}
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
              <FiTrendingUp className="text-emerald-400" />
              <h3 className="text-xs font-bold text-white">Top 10 Most Practiced Topics</h3>
            </div>
            <div className="divide-y divide-slate-900">
              {(h.topUsedTopics || []).length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-10">No practice data yet.</p>
              ) : (h.topUsedTopics || []).map((t, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-slate-600 w-4 shrink-0">#{i + 1}</span>
                    <span className="text-xs text-slate-300 truncate">{t.topicName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0 ml-2">
                    {t.usageCount?.toLocaleString()} uses
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Least Used */}
          <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
              <FiTrendingDown className="text-rose-400" />
              <h3 className="text-xs font-bold text-white">10 Least Covered Topics</h3>
            </div>
            <div className="divide-y divide-slate-900">
              {(h.leastUsedTopics || []).length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-10">No question data yet.</p>
              ) : (h.leastUsedTopics || []).map((t, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-mono text-slate-600 w-4 shrink-0">#{i + 1}</span>
                    <span className="text-xs text-slate-300 truncate">{t.topicName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-rose-400 font-bold shrink-0 ml-2">
                    {t.count || 0} Qs
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Missing Content Table ── */}
        <div className="bg-[#0d1117] border border-slate-800/80 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="px-5 py-4 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FiAlertTriangle className="text-amber-400" />
              <h3 className="text-xs font-bold text-white">Missing Content Report</h3>
              {missing?.summary && (
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                  {missing.summary.total} topics need attention
                </span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-[11px]" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search topics…"
                  className="bg-[#080d13] border border-slate-800 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-44"
                />
              </div>
              {/* Filter */}
              <select
                value={filterMissing} onChange={e => setFilter(e.target.value)}
                className="bg-[#080d13] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Missing</option>
                <option value="questions">No Questions</option>
                <option value="tutorials">No Tutorials</option>
                <option value="pyqs">No PYQs</option>
                <option value="interview">No Interview</option>
              </select>
              {/* Download */}
              <button onClick={downloadCSV}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500 px-2.5 py-1.5 rounded-lg transition-colors">
                <FiDownload /> CSV
              </button>
            </div>
          </div>

          {/* Missing Summary Badges */}
          {missing?.summary && (
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-900 bg-[#080d13]">
              {[
                { label: 'No Questions',  val: missing.summary.topicsWithNoQuestions,  color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                { label: 'No Tutorials',  val: missing.summary.topicsWithNoTutorials,  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                { label: 'No PYQs',       val: missing.summary.topicsWithNoPYQs,       color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                { label: 'No Interview',  val: missing.summary.topicsWithNoInterview,   color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
              ].map(b => (
                <span key={b.label} className={`inline-block border px-2 py-0.5 rounded text-[10px] font-bold ${b.color}`}>
                  {b.label}: {b.val}
                </span>
              ))}
            </div>
          )}

          {/* Table */}
          {filteredReport.length === 0 ? (
            <p className="text-center py-16 text-slate-500 text-xs">
              {search || filterMissing !== 'all' ? 'No topics match your filters.' : 'All topics have complete content coverage! 🎉'}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-[#080d13] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {['Topic', 'Exam', 'Subject', 'Qs', 'Tutorials', 'PYQs', 'Interview', 'Missing'].map(h => (
                        <th key={h} className="px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    {(expandMissing ? filteredReport : filteredReport.slice(0, 15)).map((t, i) => (
                      <tr key={i} className="hover:bg-slate-900/20 text-slate-300">
                        <td className="px-5 py-3 font-semibold text-white max-w-[200px] truncate">{t.title}</td>
                        <td className="px-5 py-3 text-slate-400">{t.examTitle}</td>
                        <td className="px-5 py-3 text-slate-400">{t.subject}</td>
                        <td className={`px-5 py-3 font-mono font-bold ${t.questions === 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{t.questions}</td>
                        <td className={`px-5 py-3 font-mono font-bold ${t.tutorials === 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{t.tutorials}</td>
                        <td className={`px-5 py-3 font-mono font-bold ${t.pyqs === 0 ? 'text-orange-400' : 'text-emerald-400'}`}>{t.pyqs}</td>
                        <td className={`px-5 py-3 font-mono font-bold ${t.interview === 0 ? 'text-violet-400' : 'text-emerald-400'}`}>{t.interview}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {t.missing.map(m => <MissingBadge key={m} label={m} />)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredReport.length > 15 && (
                <button
                  onClick={() => setExpandMissing(!expandMissing)}
                  className="w-full text-center py-3 text-xs text-indigo-400 hover:text-indigo-300 border-t border-slate-900 flex items-center justify-center gap-1.5 font-semibold"
                >
                  {expandMissing
                    ? <><FiChevronDown className="rotate-180" /> Show Less</>
                    : <><FiChevronRight /> Show All {filteredReport.length} Topics</>}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
