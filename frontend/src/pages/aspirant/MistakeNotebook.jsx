import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen, FiPlay, FiTrash2, FiSearch, FiSliders,
  FiFilter, FiAlertCircle, FiLoader, FiChevronLeft, FiChevronRight,
  FiBook, FiActivity, FiAward
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import revisionAPI from '../../api/revisionApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function MistakeNotebook() {
  const navigate = useNavigate();

  // List states
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Summary status counters
  const [summary, setSummary] = useState({ pendingCount: 0, masteredCount: 0 });

  // Filter lists loaded from API
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selected filter values
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // pending, mastered
  const [selectedSourceType, setSelectedSourceType] = useState(''); // all, official_pyq, current_affairs, original_practice

  // Action status loading
  const [archivingId, setArchivingId] = useState(null);

  // 1. Initial Load: fetch lists for filters
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data || []);
      } catch (err) {
        console.warn('Failed to load exams list for filter', err);
      }
    };
    loadFiltersData();
  }, []);

  // 2. Fetch Syllabus (Phases, Subjects, Topics) when Exam changes
  useEffect(() => {
    if (!selectedExam) {
      setPhases([]);
      setSubjects([]);
      setTopics([]);
      setSelectedPhase('');
      setSelectedSubject('');
      setSelectedTopic('');
      return;
    }

    const loadSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        setPhases(data.phases || []);
        setSubjects(data.subjects || []);
        setTopics(data.topics || []);
        // Reset selection values
        setSelectedPhase('');
        setSelectedSubject('');
        setSelectedTopic('');
      } catch (err) {
        console.warn('Failed to load syllabus details', err);
      }
    };
    loadSyllabus();
  }, [selectedExam]);

  // 3. Fetch Mistakes notebook list
  const fetchMistakes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };

      if (selectedExam)     params.examId = selectedExam;
      if (selectedPhase)    params.phaseId = selectedPhase;
      if (selectedSubject)  params.subjectId = selectedSubject;
      if (selectedTopic)    params.topicId = selectedTopic;
      if (selectedPriority) params.priority = selectedPriority;
      if (selectedStatus)   params.status = selectedStatus;
      if (selectedSourceType) params.sourceType = selectedSourceType;

      const { data } = await revisionAPI.getMistakeNotebook(params);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        throw new Error('Failed to load mistakes.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch mistake notebook items.');
      toast.error('Error loading mistake notebook.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedPhase, selectedSubject, selectedTopic, selectedPriority, selectedStatus, selectedSourceType]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  // Handle pagination clicks
  const handlePageChange = (p) => {
    if (p >= 1 && p <= pages) setPage(p);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSelectedExam('');
    setSelectedPhase('');
    setSelectedSubject('');
    setSelectedTopic('');
    setSelectedPriority('');
    setSelectedStatus('');
    setSelectedSourceType('');
    setPage(1);
    setSearchQuery('');
  };

  // Soft archive mistake card
  const handleArchiveItem = async (id) => {
    if (!window.confirm('Archive this mistake item? It will be archived and hidden from your deck.')) return;
    setArchivingId(id);
    try {
      await revisionAPI.archiveRevisionItem(id);
      toast.success('Mistake archived successfully.');
      fetchMistakes();
    } catch (err) {
      console.error(err);
      toast.error('Failed to archive mistake.');
    } finally {
      setArchivingId(null);
    }
  };

  // Client side search inside question previews
  const filteredItems = items.filter(item => {
    const qText = item.questionId?.questionText || '';
    return qText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate high priority count locally in current list (or fallback estimated)
  const highPriorityCount = items.filter(i => i.priority === 'high' && i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBookOpen className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Revision Notebook</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Mistake Notebook</h1>
            <p className="text-slate-500 text-sm mt-1">
              Analyze wrong answers from Smart Practice sessions. Categorise mistake types to resolve learning gaps.
            </p>
          </div>
          
          {/* Practice all disabled coming soon */}
          <button
            disabled
            className="bg-dark-950 border border-slate-850 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold select-none cursor-not-allowed self-start sm:self-center"
          >
            Practice All Pending Mistakes — Coming Soon
          </button>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Mistake Notebook" />

          {/* Right Workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Summary stat strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Total Mistakes</p>
                <p className="text-2xl font-black text-white mt-0.5">{total}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">High Priority</p>
                <p className="text-2xl font-black text-rose-400 mt-0.5">{highPriorityCount}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">{summary.pendingCount}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Mastered</p>
                <p className="text-2xl font-black text-emerald-450 mt-0.5">{summary.masteredCount}</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Filter Mistake Notebook
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">

                {/* Exam select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Exams</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {/* Phase select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phase / Stage</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedPhase}
                    onChange={(e) => { setSelectedPhase(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold disabled:opacity-40"
                  >
                    <option value="">All Stages</option>
                    {phases.map(ph => (
                      <option key={ph._id} value={ph._id}>{ph.title}</option>
                    ))}
                  </select>
                </div>

                {/* Subject select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold disabled:opacity-40"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.title}</option>
                    ))}
                  </select>
                </div>

                {/* Topic select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Topic</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedTopic}
                    onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold disabled:opacity-40"
                  >
                    <option value="">All Topics</option>
                    {topics.map(top => (
                      <option key={top._id} value={top._id}>{top.title}</option>
                    ))}
                  </select>
                </div>

                {/* Priority filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority Level</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => { setSelectedPriority(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Status filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="mastered">Mastered</option>
                  </select>
                </div>

                {/* Source Type filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source Type</label>
                  <select
                    value={selectedSourceType}
                    onChange={(e) => { setSelectedSourceType(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Sources</option>
                    <option value="official_pyq">Official PYQ</option>
                    <option value="current_affairs">Current Affairs</option>
                    <option value="original_practice">Original Practice</option>
                  </select>
                </div>

              </div>

              {/* Search input */}
              <div className="relative pt-2">
                <FiSearch className="absolute left-3.5 top-5.5 text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search mistake question text preview..."
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
                <p className="text-slate-500 text-xs font-semibold">Loading mistakes history...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchMistakes} className="btn-primary text-xs px-4 py-2">
                  Retry
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiBook className="text-4xl text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Mistakes Logged</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your mistake notebook is clean! Make sure to take smart practice tests and wrong answers will automatically log here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Mistakes cards list */}
                <div className="space-y-3.5">
                  {filteredItems.map((item) => {
                    const q = item.questionId || {};
                    return (
                      <div key={item._id} className="glass-card p-5 border-slate-800 bg-dark-900/30 space-y-4">
                        
                        {/* Header stats badges */}
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                            <span className={`px-2 py-0.5 rounded border ${
                              item.status === 'mastered'
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            } uppercase tracking-wider`}>
                              {item.status}
                            </span>
                            <span className="bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded capitalize text-slate-350">
                              Priority: {item.priority}
                            </span>
                            <span className="bg-slate-800/50 border border-slate-750/50 px-2 py-0.5 rounded text-slate-450">
                              Attempt: {item.revisionCount} revisions
                            </span>
                            {item.sourceType && (() => {
                              const stLabel = item.sourceType === 'official_pyq' || item.sourceType === 'verified_previous_year'
                                ? 'PYQ'
                                : item.sourceType === 'current_affairs'
                                  ? 'Current Affairs'
                                  : item.sourceType === 'mock_test'
                                    ? 'Mock Test'
                                    : 'Practice';
                              const stColor = stLabel === 'PYQ'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                : stLabel === 'Current Affairs'
                                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                  : 'bg-brand-500/10 border-brand-500/20 text-brand-400';
                              return (
                                <span className={`${stColor} border px-2 py-0.5 rounded uppercase`}>
                                  {stLabel}
                                </span>
                              );
                            })()}
                          </div>
                          
                          {item.lastRevisedAt && (
                            <div className="text-[10px] text-slate-500 font-semibold">
                              Last Practice: {new Date(item.lastRevisedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {/* Question Preview text */}
                        <p className="text-xs sm:text-[13px] text-slate-200 font-semibold leading-relaxed line-clamp-3 whitespace-pre-line bg-dark-950/40 border border-slate-850 rounded-xl p-3 sm:p-4">
                          {q.questionText || 'No details available'}
                        </p>

                        {/* Subtopics chips */}
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400">
                          {item.subjectId && (
                            <span className="bg-slate-850/50 px-2.5 py-1 rounded">
                              Subject: {item.subjectId.title || item.subjectId}
                            </span>
                          )}
                          {item.topicId && (
                            <span className="bg-slate-850/30 px-2.5 py-1 rounded">
                              Topic: {item.topicId.title || item.topicId}
                            </span>
                          )}
                          {item.note && (
                            <span className="bg-slate-800/10 text-brand-350 px-2.5 py-1 rounded italic truncate max-w-xs">
                              Note: {item.note}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="border-t border-slate-850 pt-4 flex justify-end gap-2.5">
                          <button
                            onClick={() => handleArchiveItem(item._id)}
                            disabled={archivingId === item._id}
                            className="btn-secondary text-[11px] font-bold px-3 py-2 text-rose-450 border-slate-850 hover:bg-rose-500/5"
                          >
                            <FiTrash2 /> Archive
                          </button>
                          
                          <button
                            onClick={() => navigate(`/aspirant/revision/question/${item._id}`)}
                            className="btn-primary text-[11px] font-bold px-4 py-2"
                          >
                            <FiPlay /> Start Revision
                          </button>
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
                      Page {page} of {pages} ({total} mistakes)
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
