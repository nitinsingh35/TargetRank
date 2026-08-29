import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBookmark, FiPlay, FiPlus, FiTrash2, FiSearch, FiSliders,
  FiFilter, FiAlertCircle, FiLoader, FiChevronLeft, FiChevronRight,
  FiGrid
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import revisionAPI from '../../api/revisionApi.js';
import questionAPI from '../../api/questionApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function BookmarkedQuestions() {
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
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selected filter values
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');

  // Individual button action indicators
  const [processingId, setProcessingId] = useState(null);

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
      setSubjects([]);
      setTopics([]);
      setSelectedSubject('');
      setSelectedTopic('');
      return;
    }

    const loadSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        setSubjects(data.subjects || []);
        setTopics(data.topics || []);
        setSelectedSubject('');
        setSelectedTopic('');
      } catch (err) {
        console.warn('Failed to load syllabus details', err);
      }
    };
    loadSyllabus();
  }, [selectedExam]);

  // 3. Fetch Bookmarks list from Revision Controller
  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
      };

      if (selectedExam)    params.examId = selectedExam;
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedTopic)   params.topicId = selectedTopic;

      const { data } = await revisionAPI.getBookmarks(params);
      if (data.success) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        throw new Error('Failed to load bookmarks.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch bookmarks list.');
      toast.error('Error loading bookmarked questions.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedSubject, selectedTopic]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Handle pagination clicks
  const handlePageChange = (p) => {
    if (p >= 1 && p <= pages) setPage(p);
  };

  // Reset filters
  const handleClearFilters = () => {
    setSelectedExam('');
    setSelectedSubject('');
    setSelectedTopic('');
    setPage(1);
    setSearchQuery('');
  };

  // POST /api/revision/from-bookmark/:questionId
  const handleAddToRevision = async (questionId) => {
    setProcessingId(questionId);
    try {
      const { data } = await revisionAPI.createFromBookmark(questionId);
      if (data.success) {
        toast.success(data.created ? 'Added to spaced repetition deck!' : 'Already in revision.');
        fetchBookmarks();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add question to revision.');
    } finally {
      setProcessingId(null);
    }
  };

  // Remove bookmark using standard toggleBookmark
  const handleRemoveBookmark = async (questionId) => {
    if (!window.confirm('Remove bookmark for this question?')) return;
    setProcessingId(questionId);
    try {
      await questionAPI.toggleBookmark(questionId);
      toast.success('Bookmark removed.');
      fetchBookmarks();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove bookmark.');
    } finally {
      setProcessingId(null);
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
            <FiBookmark className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Saved Bank</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Bookmarked Questions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Questions you flagged during mock tests or smart practices. Add them to Revision Deck to study later.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Bookmarked Questions" />

          {/* Right Workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Filter Controls */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Filter Bookmarks
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Selectors grid */}
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

              </div>

              {/* Search input */}
              <div className="relative pt-2">
                <FiSearch className="absolute left-3.5 top-5.5 text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search bookmarked question text preview..."
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
                <p className="text-slate-500 text-xs font-semibold">Loading bookmarks bank...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchBookmarks} className="btn-primary text-xs px-4 py-2">
                  Retry
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiBookmark className="text-4xl text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Bookmarks Flagged</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your bookmarks collection is currently empty. Bookmark questions during active practice sessions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Bookmark Cards list */}
                <div className="space-y-3.5">
                  {filteredItems.map((item) => {
                    const q = item.questionId || {};
                    const revItem = item.revisionItem;
                    const hasRevisionItem = !!revItem;
                    const isProcessing = processingId === q._id;

                    return (
                      <div key={item._id} className="glass-card p-5 border-slate-800 bg-dark-900/30 space-y-4">
                        
                        {/* Header context */}
                        <div className="flex justify-between items-start gap-4 flex-wrap">
                          <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold">
                            {hasRevisionItem ? (
                              <span className="text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-extrabold flex items-center gap-1">
                                <FiGrid className="text-[8px]" /> Already In Revision
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                                Bookmark Saved
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-slate-500 font-semibold">
                            Flagged: {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Question Preview text */}
                        <p className="text-xs sm:text-[13px] text-slate-200 font-semibold leading-relaxed line-clamp-3 whitespace-pre-line bg-dark-950/40 border border-slate-850 rounded-xl p-3 sm:p-4">
                          {q.questionText || 'No details available'}
                        </p>

                        {/* Subject topic context */}
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-450">
                          {q.subjectId && (
                            <span className="bg-slate-850/50 px-2.5 py-1 rounded">
                              Subject: {q.subjectId.title || 'General'}
                            </span>
                          )}
                          {q.topicId && (
                            <span className="bg-slate-850/30 px-2.5 py-1 rounded">
                              Topic: {q.topicId.title || 'Concept'}
                            </span>
                          )}
                        </div>

                        {/* Card Actions buttons footer */}
                        <div className="border-t border-slate-850 pt-4 flex justify-between items-center flex-wrap gap-3">
                          <button
                            onClick={() => handleRemoveBookmark(q._id)}
                            disabled={isProcessing}
                            className="text-xs font-semibold text-slate-650 hover:text-rose-400 flex items-center gap-1.5 transition-colors disabled:opacity-40"
                          >
                            <FiTrash2 className="text-xs" /> Remove Bookmark
                          </button>

                          <div className="flex gap-2">
                            {hasRevisionItem ? (
                              <button
                                onClick={() => navigate(`/aspirant/revision/question/${revItem._id}`)}
                                className="btn-secondary text-[11px] font-bold px-4 py-2 hover:bg-slate-900 border-slate-850"
                              >
                                <FiPlay /> Start Revision
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAddToRevision(q._id)}
                                disabled={isProcessing}
                                className="btn-primary text-[11px] font-bold px-4 py-2 shadow-md shadow-brand-500/10"
                              >
                                <FiPlus /> Add to Revision
                              </button>
                            )}
                          </div>
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
                      Page {page} of {pages} ({total} bookmarks)
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
