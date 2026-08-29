import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock, FiAward, FiSliders, FiFilter, FiAlertCircle,
  FiLoader, FiChevronLeft, FiChevronRight, FiCheckSquare,
  FiPlay, FiEye, FiCheck, FiX, FiCalendar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import previousYearPaperAPI from '../../api/previousYearPaperApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function PaperAttemptHistory() {
  const navigate = useNavigate();

  // List states
  const [attempts, setAttempts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Summary statistics averages
  const [totalAttempted, setTotalAttempted] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [avgAccuracy, setAvgAccuracy] = useState(0);

  // Filters list from API
  const [exams, setExams] = useState([]);

  // Selected filters
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // 1. Initial Load: fetch exams list for filter
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data || []);
      } catch (err) {
        console.warn('Failed to load exams list for filter', err);
      }
    };
    loadExams();
  }, []);

  // 2. Fetch Attempts list
  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };

      if (selectedExam)   params.examId = selectedExam;
      if (selectedYear)   params.year = Number(selectedYear);
      if (selectedType)   params.paperType = selectedType;
      if (selectedStatus) params.status = selectedStatus;

      const { data } = await previousYearPaperAPI.getAttemptHistory(params);
      if (data.success) {
        setAttempts(data.attempts || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        throw new Error('Failed to load attempts list.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch attempts list.');
      toast.error('Error loading attempt history.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedYear, selectedType, selectedStatus]);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  // 3. Load general statistics aggregate summaries across all attempts (unpaginated fetch)
  useEffect(() => {
    const fetchGeneralStats = async () => {
      try {
        // Fetch a large first page to calculate accurate statistics averages
        const { data } = await previousYearPaperAPI.getAttemptHistory({ page: 1, limit: 100 });
        if (data.success && data.attempts?.length > 0) {
          const list = data.attempts;
          setTotalAttempted(data.total);

          const submitted = list.filter(a => a.status === 'submitted' || a.status === 'expired');
          setSubmittedCount(submitted.length);

          if (submitted.length > 0) {
            const sumScore = submitted.reduce((sum, a) => sum + (a.score || 0), 0);
            const sumAcc = submitted.reduce((sum, a) => sum + (a.accuracy || 0), 0);
            setAvgScore(Number((sumScore / submitted.length).toFixed(1)));
            setAvgAccuracy(Number((sumAcc / submitted.length).toFixed(1)));
          } else {
            setAvgScore(0);
            setAvgAccuracy(0);
          }
        } else {
          setTotalAttempted(0);
          setSubmittedCount(0);
          setAvgScore(0);
          setAvgAccuracy(0);
        }
      } catch (err) {
        console.warn('Failed to calculate general stats summaries', err);
      }
    };
    fetchGeneralStats();
  }, [selectedExam, selectedYear, selectedType, selectedStatus]); // Recalculate when filters change

  // Handle page changes
  const handlePageChange = (p) => {
    if (p >= 1 && p <= pages) setPage(p);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSelectedExam('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedStatus('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiClock className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">PYQ Mock Simulator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Paper Attempt History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review detailed reports, question keys, section performance, and Cut-Off standing charts.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Paper Attempt History" />

          {/* Right workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* General metrics summary panel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Total Attempts</p>
                <p className="text-2xl font-black text-white mt-0.5">{totalAttempted}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Submitted</p>
                <p className="text-2xl font-black text-emerald-450 mt-0.5">{submittedCount}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Average Score</p>
                <p className="text-2xl font-black text-brand-400 mt-0.5">{avgScore} <span className="text-[10px] text-slate-500">Marks</span></p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Avg Accuracy</p>
                <p className="text-2xl font-black text-amber-450 mt-0.5">{avgAccuracy}%</p>
              </div>
            </div>

            {/* Filters bar */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Filter Attempts
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Selection selects grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Exam select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Exams</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {/* Year select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paper Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Type select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paper Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Types</option>
                    <option value="prelims">Prelims</option>
                    <option value="mains">Mains</option>
                    <option value="tier_1">Tier 1</option>
                    <option value="tier_2">Tier 2</option>
                    <option value="objective">Objective</option>
                    <option value="descriptive">Descriptive</option>
                  </select>
                </div>

                {/* Status select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attempt Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Statuses</option>
                    <option value="started">Active</option>
                    <option value="submitted">Submitted</option>
                    <option value="expired">Expired</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>

              </div>
            </div>

            {/* List spaces */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FiLoader className="text-3xl text-brand-500 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading attempt logs...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchAttempts} className="btn-primary text-xs px-4 py-2">
                  Retry
                </button>
              </div>
            ) : attempts.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiCheckSquare className="text-4xl text-slate-550 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Attempts History</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have not attempted any past papers under current filters. Browse the Previous-Year Papers library to start a session.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Attempts cards listing */}
                <div className="space-y-3.5">
                  {attempts.map((attempt) => {
                    const paper = attempt.paperId || {};
                    const isSubmitted = attempt.status === 'submitted' || attempt.status === 'expired';
                    const isExpired = attempt.status === 'expired';
                    const isStarted = attempt.status === 'started' || attempt.status === 'created';

                    return (
                      <div key={attempt._id} className="glass-card border-slate-800 bg-dark-900/30 p-5 flex flex-col justify-between space-y-4">
                        
                        {/* Header details */}
                        <div className="flex justify-between items-start gap-4 flex-wrap pb-1.5 border-b border-slate-850">
                          <div className="space-y-1">
                            <h3 className="text-xs sm:text-sm font-extrabold text-white leading-relaxed">
                              {paper.title || 'PYQ Attempt'}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold">
                              <span>{paper.examId?.title}</span>
                              <span>•</span>
                              <span>{paper.year} PYQ</span>
                              <span>•</span>
                              <span className="capitalize">{paper.paperType}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold shrink-0">
                            <FiCalendar />
                            <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Mid Section: Statistics or active timer info */}
                        {isSubmitted ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
                            <div className="bg-dark-950/60 p-2.5 rounded-xl border border-slate-850 text-center">
                              <p className="text-[9px] text-slate-550 font-bold uppercase">Marks</p>
                              <p className="text-xs font-black text-brand-400 mt-0.5">{attempt.score}/{attempt.totalMarks}</p>
                            </div>
                            <div className="bg-dark-950/60 p-2.5 rounded-xl border border-slate-850 text-center">
                              <p className="text-[9px] text-slate-550 font-bold uppercase">Accuracy</p>
                              <p className="text-xs font-black text-amber-450 mt-0.5">{attempt.accuracy}%</p>
                            </div>
                            <div className="bg-dark-950/60 p-2.5 rounded-xl border border-slate-850 text-center">
                              <p className="text-[9px] text-slate-550 font-bold uppercase">Performance</p>
                              <p className="text-[10px] font-black text-slate-350 mt-1 flex items-center justify-center gap-1">
                                <span className="text-emerald-450">+{attempt.correctCount}</span>
                                <span>/</span>
                                <span className="text-rose-455">-{attempt.incorrectCount}</span>
                              </p>
                            </div>
                            <div className="bg-dark-950/60 p-2.5 rounded-xl border border-slate-850 text-center">
                              <p className="text-[9px] text-slate-550 font-bold uppercase">Submission</p>
                              <p className={`text-[9px] font-black uppercase mt-1 ${isExpired || attempt.autoSubmitted ? 'text-amber-500' : 'text-emerald-400'}`}>
                                {isExpired || attempt.autoSubmitted ? 'Auto' : 'Manual'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-xs text-amber-400 leading-relaxed">
                            <p className="font-bold flex items-center gap-1.5">
                              <FiAlertCircle /> Active Attempt Session Pending
                            </p>
                            <p className="text-[10px] opacity-80 mt-0.5">
                              You have an active ongoing session that was not submitted. Resume now to complete the paper test.
                            </p>
                          </div>
                        )}

                        {/* Footer Trigger buttons */}
                        <div className="border-t border-slate-850 pt-3 flex justify-end">
                          {isSubmitted ? (
                            <button
                              onClick={() => navigate(`/aspirant/previous-year-papers/attempt/${attempt._id}/result`)}
                              className="btn-secondary py-2 px-4 text-xs font-bold border-slate-850 hover:bg-dark-900 flex items-center gap-1.5"
                            >
                              <FiEye /> View Result Summary
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/aspirant/previous-year-papers/attempt/${attempt._id}`)}
                              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                            >
                              <FiPlay /> Resume Attempt
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-4 border-t border-slate-850">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="btn-secondary py-2 px-3 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft /> Prev
                    </button>
                    <span>
                      Page {page} of {pages} ({total} total attempts)
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pages}
                      className="btn-secondary py-2 px-3 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <FiChevronRight />
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
