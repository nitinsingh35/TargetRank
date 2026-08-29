import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock, FiPlay, FiTrash2, FiSearch, FiSliders,
  FiFilter, FiAlertCircle, FiLoader, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import revisionAPI from '../../api/revisionApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function ReviseToday() {
  const navigate = useNavigate();

  // List states
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Action loading states
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
        // Reset dependant selection values
        setSelectedPhase('');
        setSelectedSubject('');
        setSelectedTopic('');
      } catch (err) {
        console.warn('Failed to load syllabus details', err);
      }
    };
    loadSyllabus();
  }, [selectedExam]);

  // 3. Fetch due items list
  const fetchDueItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        status: 'pending',
      };

      if (selectedExam)       params.examId = selectedExam;
      if (selectedPhase)      params.phaseId = selectedPhase;
      if (selectedSubject)    params.subjectId = selectedSubject;
      if (selectedTopic)      params.topicId = selectedTopic;
      if (selectedSourceType) params.sourceType = selectedSourceType;
      if (selectedPriority)   params.priority = selectedPriority;

      const { data } = await revisionAPI.getToday(params);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        throw new Error('Failed to load revision items list.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch today\'s revision items.');
      toast.error('Error loading revision deck.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedPhase, selectedSubject, selectedTopic, selectedSourceType, selectedPriority]);

  useEffect(() => {
    fetchDueItems();
  }, [fetchDueItems]);

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
    setSelectedSourceType('');
    setSelectedPriority('');
    setPage(1);
    setSearchQuery('');
  };

  // Call Archive API
  const handleArchiveItem = async (id) => {
    if (!window.confirm('Archive this revision question? It will not show up in your daily queue again.')) return;
    setArchivingId(id);
    try {
      await revisionAPI.archiveRevisionItem(id);
      toast.success('Question archived successfully.');
      fetchDueItems();
    } catch (err) {
      console.error(err);
      toast.error('Failed to archive the revision item.');
    } finally {
      setArchivingId(null);
    }
  };

  // Client side search matching text in questionText
  const filteredItems = items.filter(item => {
    const qText = item.questionId?.questionText || '';
    return qText.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiClock className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Spaced Deck</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Revise Today</h1>
          <p className="text-slate-500 text-sm mt-1">
            Solve questions currently due or overdue for spaced repetition. Archive items you've mastered.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Revise Today" />

          {/* Right Main Revision Workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Filter controls panel */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Filter Revision Deck
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Grid selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
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
                    <option value="wrong_answer">Wrong Answers</option>
                    <option value="bookmarked">Bookmarked</option>
                    <option value="manual">Manual Entry</option>
                    <option value="mock_test">Mock Tests</option>
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
                    <option value="high">High (Due/Overdue)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

              </div>

              {/* Search input */}
              <div className="relative pt-2">
                <FiSearch className="absolute left-3.5 top-5.5 text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search question text preview in current page..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-550"
                />
              </div>

            </div>

            {/* List space */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FiLoader className="text-3xl text-brand-500 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading revision deck...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchDueItems} className="btn-primary text-xs px-4 py-2">
                  Retry
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiClock className="text-4xl text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Revision Items Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no revision questions currently matching your criteria. Try widening your filters or clearing search text.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Deck Cards list */}
                <div className="space-y-3.5">
                  {filteredItems.map((item) => {
                    const q = item.questionId || {};
                    const isOverdue = new Date(item.nextRevisionDate) < new Date();
                    
                    return (
                      <div key={item._id} className="glass-card p-5 border-slate-800 bg-dark-900/30 space-y-4">
                        
                        {/* Header metadata row */}
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                            {isOverdue ? (
                              <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-black">
                                Overdue
                              </span>
                            ) : (
                              <span className="text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
                                Due Today
                              </span>
                            )}
                            <span className="bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded capitalize text-slate-350">
                              Priority: {item.priority}
                            </span>
                            {item.sourceType && (() => {
                              const raw = item.sourceType;
                              const stLabel = (raw === 'official_pyq' || raw === 'verified_previous_year')
                                ? 'PYQ'
                                : raw === 'current_affairs'
                                  ? 'Current Affairs'
                                  : raw === 'mock_test'
                                    ? 'Mock Test'
                                    : raw.replace(/_/g, ' ');
                              const stCls = stLabel === 'PYQ'
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : stLabel === 'Current Affairs'
                                  ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                                  : 'bg-slate-800/50 border-slate-750/50 text-slate-400';
                              return (
                                <span className={`${stCls} border px-2 py-0.5 rounded capitalize`}>
                                  {stLabel}
                                </span>
                              );
                            })()}
                          </div>
                          
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Due: {new Date(item.nextRevisionDate).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Question Text preview */}
                        <p className="text-xs sm:text-[13px] text-slate-200 font-semibold leading-relaxed line-clamp-3 whitespace-pre-line bg-dark-950/40 border border-slate-850 rounded-xl p-3 sm:p-4">
                          {q.questionText || 'No question details available'}
                        </p>

                        {/* Subjects, Syllabus context */}
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400">
                          {item.subjectId && (
                            <span className="bg-slate-850/50 px-2.5 py-1 rounded">
                              Subject: {item.subjectId.title}
                            </span>
                          )}
                          {item.topicId && (
                            <span className="bg-slate-850/30 px-2.5 py-1 rounded">
                              Topic: {item.topicId.title}
                            </span>
                          )}
                          <span className="bg-slate-850/20 px-2.5 py-1 rounded text-slate-500">
                            Count: {item.revisionCount} revisions
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="border-t border-slate-850 pt-4.5 flex justify-end gap-2.5">
                          <button
                            onClick={() => handleArchiveItem(item._id)}
                            disabled={archivingId === item._id}
                            className="btn-secondary text-[11px] font-bold px-3 py-2 text-rose-400 border-slate-850 hover:bg-rose-500/5"
                            title="Soft archive question"
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

                {/* Pagination Controls */}
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
                      Page {page} of {pages} ({total} total items)
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
