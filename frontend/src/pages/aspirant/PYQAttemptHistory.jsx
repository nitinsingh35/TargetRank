import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward, FiBarChart2, FiClock, FiCheckCircle, FiXCircle,
  FiMinus, FiArrowLeft, FiFilter, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

const STATUS_STYLES = {
  submitted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  created:   'bg-slate-800 text-slate-400 border-slate-700',
  started:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function PYQAttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExam, setFilterExam] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 15;

  useEffect(() => {
    loadExams();
    loadAttempts(1);
  }, []);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) { console.error(err); }
  };

  const loadAttempts = async (pageNum = 1, examId = filterExam, year = filterYear) => {
    setLoading(true);
    try {
      const params = { page: pageNum, limit: PAGE_SIZE };
      if (examId) params.examId = examId;
      if (year) params.year = year;
      const { data } = await pyqAPI.getMyAttempts(params);
      if (pageNum === 1) {
        setAttempts(data.attempts || []);
      } else {
        setAttempts(prev => [...prev, ...(data.attempts || [])]);
      }
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      toast.error('Failed to load attempt history.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadAttempts(1, filterExam, filterYear);
  };

  const handleLoadMore = () => {
    loadAttempts(page + 1, filterExam, filterYear);
  };

  const fmt = (val) => val === null || val === undefined ? '—' : Math.round(val);

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiBarChart2 className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">PYQ Papers</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Attempt History</h1>
          <p className="text-slate-500 text-sm mt-0.5">All your previous year paper attempts in one place.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <RevisionSidebar active="PYQ Papers" />

          <div className="flex-1 space-y-5">

            {/* Filters */}
            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-2">
              <FiFilter className="text-slate-500 text-sm shrink-0" />
              <select
                value={filterExam}
                onChange={e => setFilterExam(e.target.value)}
                className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
              >
                <option value="">All Exams</option>
                {exams.map(e => (
                  <option key={e._id} value={e._id}>{e.title}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Year"
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 w-24"
              />
              <button
                onClick={handleFilter}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                Apply
              </button>
            </div>

            {/* List */}
            {loading && attempts.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FiAward className="text-4xl text-slate-700 mx-auto" />
                <p className="text-slate-400 font-semibold">No attempts yet.</p>
                <Link to="/aspirant/pyq-papers" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-all">
                  <FiAward /> Browse PYQ Papers
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map(attempt => {
                  const pct = attempt.scorePercentage;
                  const barColor = pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                  const textColor = pct >= 60 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-rose-400';
                  return (
                    <div key={attempt._id} className="bg-dark-900/60 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{attempt.paperTitle}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {attempt.examTitle} · {attempt.year} · {attempt.paperType}
                          </p>
                          {/* Metadata row */}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {attempt.status === 'submitted' && (
                              <>
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                  <FiCheckCircle className="text-[11px]" /> {attempt.correct} correct
                                </span>
                                <span className="flex items-center gap-1 text-xs text-rose-400">
                                  <FiXCircle className="text-[11px]" /> {attempt.wrong} wrong
                                </span>
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <FiMinus className="text-[11px]" /> {attempt.skipped} skipped
                                </span>
                              </>
                            )}
                            {attempt.timeTakenMinutes && (
                              <span className="flex items-center gap-1 text-xs text-blue-400">
                                <FiClock className="text-[11px]" /> {attempt.timeTakenMinutes} min
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${STATUS_STYLES[attempt.status] || STATUS_STYLES.created}`}>
                            {attempt.status}
                          </span>
                          {attempt.status === 'submitted' && pct !== undefined && (
                            <span className={`text-xl font-black ${textColor}`}>{fmt(pct)}%</span>
                          )}
                        </div>
                      </div>

                      {/* Score bar */}
                      {attempt.status === 'submitted' && pct !== undefined && (
                        <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      )}

                      {/* Link */}
                      <div className="mt-3 flex justify-end">
                        {attempt.status === 'submitted' ? (
                          <Link
                            to={`/aspirant/pyq-papers/attempt/${attempt._id}/result`}
                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                          >
                            View Result <FiChevronRight />
                          </Link>
                        ) : (
                          <Link
                            to={`/aspirant/pyq-papers/attempt/${attempt._id}`}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                          >
                            Resume <FiChevronRight />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}

                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-3 bg-dark-800 border border-slate-700 hover:bg-dark-700 text-slate-300 text-sm font-semibold rounded-2xl transition-all disabled:opacity-60"
                  >
                    {loading ? 'Loading…' : 'Load More'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
