import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiBookOpen, FiPlay, FiSearch, FiSliders, FiFilter,
  FiAlertCircle, FiLoader, FiChevronLeft, FiChevronRight, FiClock,
  FiBook, FiAward, FiBookmark, FiGrid, FiRotateCcw, FiEye, FiEdit3
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import previousYearPaperAPI from '../../api/previousYearPaperApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function PreviousYearPapers() {
  const navigate = useNavigate();

  // List states
  const [papers, setPapers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown list states
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);

  // Filter selections
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLang, setSelectedLang] = useState('');

  // Start attempt status
  const [startingPaperId, setStartingPaperId] = useState(null);

  // 1. Initial Load: fetch exams list
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

  // 2. Fetch Syllabus (Phases) when Exam changes
  useEffect(() => {
    if (!selectedExam) {
      setPhases([]);
      setSelectedPhase('');
      return;
    }

    const loadSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        setPhases(data.phases || []);
        setSelectedPhase('');
      } catch (err) {
        console.warn('Failed to load syllabus details', err);
      }
    };
    loadSyllabus();
  }, [selectedExam]);

  // 3. Fetch papers list
  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 9,
      };

      if (selectedExam)  params.examId = selectedExam;
      if (selectedPhase) params.phaseId = selectedPhase;
      if (selectedYear)  params.year = Number(selectedYear);
      if (selectedType)  params.paperType = selectedType;
      if (selectedLang)  params.language = selectedLang;

      const { data } = await previousYearPaperAPI.getPapers(params);
      if (data.success) {
        setPapers(data.papers || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        throw new Error('Failed to load papers list.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch previous-year papers list.');
      toast.error('Error loading papers library.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedPhase, selectedYear, selectedType, selectedLang]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  // Reset filters
  const handleClearFilters = () => {
    setSelectedExam('');
    setSelectedPhase('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedLang('');
    setPage(1);
    setSearchQuery('');
  };

  // Start new attempt on a paper
  const handleStartPaper = async (paperId) => {
    setStartingPaperId(paperId);
    const toastId = toast.loading('Initializing mock exam engine...');
    try {
      const { data } = await previousYearPaperAPI.startAttempt(paperId);
      if (data.success && data.attempt) {
        toast.success('Attempt session successfully loaded.', { id: toastId });
        navigate(`/aspirant/previous-year-papers/attempt/${data.attempt._id}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to start mock attempt.', { id: toastId });
    } finally {
      setStartingPaperId(null);
    }
  };

  // Client side search matching text in titles
  const filteredPapers = papers.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.paperCode || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiBookOpen className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">PYQ Mock Simulator</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Previous-Year Papers</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse and simulate official past papers in standard offline environments with CUT-OFF analysis.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Previous-Year Papers" />

          {/* Right Main Content */}
          <div className="flex-1 w-full space-y-6">

            {/* Filter controls panel */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Filter Papers
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Selectors grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                
                {/* Exam select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-350 font-semibold"
                  >
                    <option value="">All Exams</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {/* Phase select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Stage</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedPhase}
                    onChange={(e) => { setSelectedPhase(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-355 font-semibold disabled:opacity-30"
                  >
                    <option value="">All Stages</option>
                    {phases.map(ph => (
                      <option key={ph._id} value={ph._id}>{ph.title}</option>
                    ))}
                  </select>
                </div>

                {/* Year filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-350 font-semibold"
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Paper Type filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-350 font-semibold"
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

                {/* Language filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Language</label>
                  <select
                    value={selectedLang}
                    onChange={(e) => { setSelectedLang(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-350 font-semibold"
                  >
                    <option value="">All Languages</option>
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </div>

              </div>

              {/* Search input */}
              <div className="relative pt-1">
                <FiSearch className="absolute left-3.5 top-4.5 text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search papers by title or exam code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-550"
                />
              </div>

            </div>

            {/* List spaces */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FiLoader className="text-3xl text-brand-500 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading papers library...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchPapers} className="btn-primary text-xs px-4 py-2">
                  Retry
                </button>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiBook className="text-4xl text-slate-550 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Papers Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No previous-year papers are available for this filter yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Papers cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPapers.map((paper) => {
                    const status = paper.attemptStatus || 'not_started';
                    const hasResult = !!paper.latestResultSummary;
                    const result = paper.latestResultSummary;
                    const isProcessing = startingPaperId === paper._id;

                    return (
                      <div key={paper._id} className="glass-card border-slate-800 bg-dark-900/30 p-5 flex flex-col justify-between space-y-4">
                        
                        {/* Header details */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                            <span className="uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              Code: {paper.paperCode || 'PYQ'}
                            </span>
                            <span>{paper.year} Paper</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-white line-clamp-2 pt-1">{paper.title}</h3>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                            <span>{paper.examId?.title}</span>
                            <span>•</span>
                            <span className="capitalize">{paper.paperType}</span>
                          </div>
                        </div>

                        {/* Paper stats list details */}
                        <ul className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 bg-dark-950/40 p-3 rounded-xl border border-slate-850">
                          <li className="flex items-center gap-1.5">
                            <FiClock className="text-slate-500 text-xs shrink-0" />
                            <span>{paper.durationMinutes} min</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <FiAward className="text-slate-500 text-xs shrink-0" />
                            <span>{paper.totalMarks} Marks</span>
                          </li>
                          <li className="flex items-center gap-1.5">
                            <FiBookOpen className="text-slate-500 text-xs shrink-0" />
                            <span>{paper.totalQuestions} Qs</span>
                          </li>
                          <li className="capitalize">
                            Lang: {paper.language}
                          </li>
                        </ul>

                        {/* Attempt status alert banner */}
                        {status !== 'not_started' && (
                          <div className="text-[10px] font-bold rounded-lg px-2.5 py-1.5 flex items-center justify-between border border-slate-850">
                            <span className="text-slate-400">Attempt:</span>
                            {status === 'started' || status === 'created' ? (
                              <span className="text-amber-400 font-black animate-pulse">Active</span>
                            ) : (
                              <span className="text-emerald-450 font-black">Completed</span>
                            )}
                          </div>
                        )}

                        {/* Attempt score stats */}
                        {hasResult && result && (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-2.5 text-[10px] font-bold text-slate-400 flex justify-between">
                            <span>Score: <strong className="text-emerald-455">{result.score}</strong>/{result.totalMarks}</span>
                            <span>Accuracy: <strong className="text-white">{result.accuracy}%</strong></span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="pt-2 flex gap-2">
                          {paper.paperType === 'mains' || paper.paperType === 'descriptive' ? (
                            <button
                              onClick={() => navigate('/aspirant/answer-writing')}
                              className="btn-primary w-full py-2 px-3 text-xs font-bold bg-indigo-700 hover:bg-indigo-650 border-indigo-750 flex items-center justify-center gap-1.5"
                            >
                              <FiEdit3 /> Practice Mains Answers
                            </button>
                          ) : (
                            <>
                              {(status === 'not_started' || status === 'abandoned') && (
                                <button
                                  disabled={isProcessing}
                                  onClick={() => handleStartPaper(paper._id)}
                                  className="btn-primary w-full py-2 px-3 text-xs font-bold"
                                >
                                  {isProcessing ? <FiLoader className="animate-spin mx-auto" /> : <><FiPlay /> Start Paper</>}
                                </button>
                              )}

                              {(status === 'started' || status === 'created') && (
                                <button
                                  onClick={() => {
                                    handleStartPaper(paper._id);
                                  }}
                                  className="btn-primary w-full py-2 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-500 border-amber-650"
                                >
                                  <FiPlay /> Resume Paper
                                </button>
                              )}

                              {(status === 'submitted' || status === 'expired') && result && (
                                <div className="flex w-full gap-1.5">
                                  <button
                                    onClick={() => navigate(`/aspirant/previous-year-papers/attempt/${result.attemptId}/result`)}
                                    className="btn-secondary flex-1 py-2 px-2 text-[10px] font-bold border-slate-855 hover:bg-dark-900"
                                    title="View result statistics"
                                  >
                                    <FiEye /> Result
                                  </button>
                                  <button
                                    onClick={() => handleStartPaper(paper._id)}
                                    className="btn-primary flex-1 py-2 px-2 text-[10px] font-bold bg-brand-700/80 hover:bg-brand-700"
                                    title="Re-attempt paper session"
                                  >
                                    <FiRotateCcw /> Re-test
                                  </button>
                                </div>
                              )}
                            </>
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
                      Page {page} of {pages} ({total} total papers)
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
