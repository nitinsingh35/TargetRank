import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiActivity, FiClock, FiCheckCircle,
  FiXCircle, FiPlay, FiFilter, FiRefreshCw, FiGrid
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

const STATUS_BADGES = {
  submitted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  created:   'bg-slate-800 text-slate-400 border-slate-700',
  started:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  expired:   'bg-rose-500/10 text-rose-400 border-rose-500/20',
  abandoned: 'bg-slate-700/50 text-slate-500 border-slate-700/20'
};

export default function CurrentAffairsHistory() {
  const [attempts, setAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterExam, setFilterExam] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadExams();
    loadAttempts();
  }, []);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttempts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterExam) params.examId = filterExam;
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      if (filterStatus) params.status = filterStatus;

      const { data } = await currentAffairsAPI.getMyHistory(params);
      setAttempts(data || []);
    } catch (err) {
      toast.error('Failed to load practice history.');
    } finally {
      setLoading(false);
    }
  };

  const fmtTime = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiActivity className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">History</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white font-sans">Current Affairs History</h1>
            <p className="text-slate-500 text-sm mt-0.5">Logs of all your previous practice sessions and scores.</p>
          </div>
          <Link
            to="/aspirant/current-affairs"
            className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            <FiArrowLeft /> Back
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <RevisionSidebar active="Current Affairs" />

          {/* Main List */}
          <div className="flex-1 space-y-5">

            {/* Filter panel */}
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
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Year"
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 w-24"
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="started">Started</option>
                <option value="created">Created</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={loadAttempts}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
              >
                <FiRefreshCw /> Apply
              </button>
            </div>

            {/* List entries */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : attempts.length === 0 ? (
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                No current affairs practice history found.
              </div>
            ) : (
              <div className="space-y-3">
                {attempts.map(att => {
                  const pct = att.accuracy;
                  const isSubmitted = att.status === 'submitted';
                  const barColor = pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                  const textColor = pct >= 60 ? 'text-emerald-400' : pct >= 40 ? 'text-amber-400' : 'text-rose-400';

                  return (
                    <div key={att._id} className="bg-dark-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-white leading-snug">{att.packName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Applicable: {att.examName} · Pack date: {new Date(0, att.month - 1).toLocaleString('en', { month: 'long' })} {att.year}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                            {isSubmitted && (
                              <>
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <FiCheckCircle className="text-[10px]" /> {att.correct}/{att.totalQuestions} correct
                                </span>
                              </>
                            )}
                            {att.timeTakenSeconds && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <FiClock className="text-[10px]" /> Time: {fmtTime(att.timeTakenSeconds)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${STATUS_BADGES[att.status] || STATUS_BADGES.created}`}>
                            {att.status}
                          </span>
                          {isSubmitted && pct !== undefined && (
                            <span className={`text-lg font-black ${textColor}`}>{Math.round(pct)}% Accuracy</span>
                          )}
                        </div>
                      </div>

                      {/* Accuracy bar */}
                      {isSubmitted && pct !== undefined && (
                        <div className="mt-3.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-1 rounded-full transition-all duration-750 ${barColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex justify-end">
                        {isSubmitted ? (
                          <Link
                            to={`/aspirant/practice-session/${att._id}/result`}
                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold transition-all"
                          >
                            View Result <FiChevronRight />
                          </Link>
                        ) : (
                          <Link
                            to={`/aspirant/practice-session/${att._id}`}
                            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-all"
                          >
                            Resume Practice <FiPlay className="text-[10px]" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
