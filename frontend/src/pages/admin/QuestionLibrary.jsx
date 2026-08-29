import React, { useState, useEffect, useMemo } from 'react';
import {
  FiFileText, FiFolder, FiCheckCircle, FiEdit2, FiTrash2, FiSearch,
  FiFilter, FiRefreshCw, FiGrid, FiPlus, FiChevronLeft, FiChevronRight,
  FiEye, FiTrendingUp, FiAlertCircle, FiSettings, FiCheckSquare, FiSquare,
  FiBookOpen, FiDownload, FiLayers, FiActivity, FiUserCheck, FiTarget,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import questionAPI from '../../api/questionApi.js';
import examAPI from '../../api/examApi.js';
import QuestionEditorModal from '../../components/admin/QuestionEditorModal.jsx';
import QuestionPreviewModal from '../../components/admin/QuestionPreviewModal.jsx';

// ─── MultiSelect Popover Dropdown ───
function MultiSelectFilter({ label, options, selectedValues, onChange }) {
  const [open, setOpen] = useState(false);

  const toggle = (val) => {
    let next = [...selectedValues];
    if (next.includes(val)) {
      next = next.filter(x => x !== val);
    } else {
      next.push(val);
    }
    onChange(next);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-1.5 px-3 py-2 bg-dark-900 border rounded-xl text-slate-300 hover:border-slate-700 transition-all font-semibold max-w-44 ${
          selectedValues.length > 0 ? 'border-brand-500/80 text-brand-400' : 'border-slate-800'
        }`}
      >
        <span className="truncate">
          {selectedValues.length === 0 ? label : `${label} (${selectedValues.length})`}
        </span>
        <FiFilter className="text-[10px]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-1.5 w-56 bg-[#0b0f19] border border-slate-800 rounded-xl shadow-2xl p-2.5 z-20 space-y-1.5 max-h-60 overflow-y-auto">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-900 text-[10px] font-bold text-slate-500 uppercase">
              <span>Select Options</span>
              {selectedValues.length > 0 && (
                <button type="button" onClick={() => onChange([])} className="text-rose-400 hover:text-rose-300">Clear</button>
              )}
            </div>
            {options.length === 0 ? (
              <div className="text-center py-2 text-slate-600 italic">No options loaded</div>
            ) : (
              options.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggle(opt.value)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-brand-500/10 text-brand-400' : 'hover:bg-dark-900/60 text-slate-400'
                    }`}
                  >
                    {isSelected ? <FiCheckSquare className="text-brand-400 text-[11px]" /> : <FiSquare className="text-slate-600 text-[11px]" />}
                    <span className="truncate text-[11px] leading-none">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN HUB ───
export default function QuestionLibrary() {
  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'analytics'
  const [stats, setStats] = useState({
    total: 0, published: 0, draft: 0, pyqs: 0, important: 0,
    currentAffairs: 0, bookBased: 0, pendingReview: 0, duplicate: 0, rejected: 0
  });

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [cardFilter, setCardFilter] = useState('');

  // ─── Dropdowns Data Caches ───
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  // ─── Filter Selections State ───
  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [selectedDiffs, setSelectedDiffs] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedImportances, setSelectedImportances] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  // ─── Bulk Action states ───
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionTarget, setBulkActionTarget] = useState(''); // Target Subject/Topic ID if moving

  // ─── Modal states ───
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // ─── Analytics states ───
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Load stats and lookups
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await questionAPI.getLibraryStats();
      setStats(data);
    } catch (err) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data);
    } catch (err) {
      toast.error('Failed to fetch lookup databases');
    }
  };

  // Fetch Questions List
  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const params = {
        page,
        limit,
        search,
        cardFilter,
        examId: selectedExams.join(','),
        phaseId: selectedPhases.join(','),
        subjectId: selectedSubjects.join(','),
        topicId: selectedTopics.join(','),
        subtopicId: selectedSubtopics.join(','),
        language: selectedLangs.join(','),
        difficulty: selectedDiffs.join(','),
        questionType: selectedTypes.join(','),
        qualityStatus: selectedStatuses.join(','),
        importanceLevel: selectedImportances.join(','),
        sourceYear: selectedYears.join(','),
      };
      const { data } = await questionAPI.listLibraryQuestions(params);
      setQuestions(data.questions || []);
      setTotalQuestions(data.total || 0);
    } catch (err) {
      toast.error('Failed to retrieve question library catalog');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const { data } = await questionAPI.getLibraryAnalytics();
      setAnalytics(data);
    } catch (err) {
      toast.error('Failed to load library aggregation data');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchQuestions();
    } else {
      fetchAnalytics();
    }
  }, [page, search, cardFilter, selectedExams, selectedPhases, selectedSubjects, selectedTopics, selectedSubtopics, selectedLangs, selectedDiffs, selectedTypes, selectedStatuses, selectedImportances, selectedYears, activeTab]);

  // Load phases dynamically if one exam selected
  useEffect(() => {
    if (selectedExams.length === 1) {
      const fetchPhases = async () => {
        try {
          const { data } = await examAPI.getExamSyllabus(selectedExams[0]);
          setPhases(data.syllabus || []);
        } catch (err) {
          toast.error('Failed to resolve phases');
        }
      };
      fetchPhases();
    } else {
      setPhases([]);
      setSelectedPhases([]);
    }
  }, [selectedExams]);

  // Populate subjects if phases loaded
  useEffect(() => {
    if (selectedPhases.length === 1 && phases.length > 0) {
      const p = phases.find(ph => ph._id === selectedPhases[0]);
      setSubjects(p?.subjects || []);
    } else {
      setSubjects([]);
      setSelectedSubjects([]);
    }
  }, [selectedPhases, phases]);

  // Populate topics if subjects loaded
  useEffect(() => {
    if (selectedSubjects.length === 1 && subjects.length > 0) {
      const s = subjects.find(sub => sub._id === selectedSubjects[0]);
      setTopics(s?.topics || []);
    } else {
      setTopics([]);
      setSelectedTopics([]);
    }
  }, [selectedSubjects, subjects]);

  // Populate subtopics if topics loaded
  useEffect(() => {
    if (selectedTopics.length === 1 && topics.length > 0) {
      const t = topics.find(top => top._id === selectedTopics[0]);
      setSubtopics(t?.subtopics || []);
    } else {
      setSubtopics([]);
      setSelectedSubtopics([]);
    }
  }, [selectedTopics, topics]);

  // ─── Bulk Operations Handlers ───
  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q._id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    
    if (action === 'delete') {
      const ok = window.confirm(`Are you sure you want to permanently delete the ${selectedIds.length} selected questions?`);
      if (!ok) return;
    }

    try {
      const payload = {
        questionIds: selectedIds,
        action,
        targetId: bulkActionTarget || undefined
      };
      await questionAPI.bulkOperations(payload);
      toast.success(`Successfully ran bulk operation: ${action}`);
      setSelectedIds([]);
      setBulkActionTarget('');
      fetchStats();
      fetchQuestions();
    } catch (err) {
      toast.error('Bulk operation action failed');
    }
  };

  // ─── CSV Export ───
  const handleExportCSV = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one question to export');
      return;
    }
    const selectedList = questions.filter(q => selectedIds.includes(q._id));
    
    const headers = ['ID', 'Type', 'Question Text', 'Difficulty', 'Status', 'Exam', 'Subject', 'Topic', 'Source'];
    const rows = selectedList.map(q => [
      q._id,
      q.questionType,
      (q.questionText || '').replace(/"/g, '""'),
      q.difficulty,
      q.qualityStatus,
      q.examId?.title || '',
      q.subjectId?.title || '',
      q.topicId?.title || '',
      q.sourceName || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TargetRank_Questions_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export downloaded!');
  };

  // Card items configurations
  const cardItems = [
    { key: '', label: 'Total Questions', value: stats.total, color: 'text-brand-400 bg-brand-500/5' },
    { key: 'published', label: 'Published', value: stats.published, color: 'text-emerald-400 bg-emerald-500/5' },
    { key: 'draft', label: 'Draft', value: stats.draft, color: 'text-slate-400 bg-slate-500/5' },
    { key: 'pyqs', label: 'PYQs', value: stats.pyqs, color: 'text-amber-400 bg-amber-500/5' },
    { key: 'important', label: 'Important', value: stats.important, color: 'text-rose-400 bg-rose-500/5' },
    { key: 'current_affairs', label: 'Current Affairs', value: stats.currentAffairs, color: 'text-cyan-400 bg-cyan-500/5' },
    { key: 'book_based', label: 'Book Based', value: stats.bookBased, color: 'text-indigo-400 bg-indigo-500/5' },
    { key: 'pending_review', label: 'Pending Review', value: stats.pendingReview, color: 'text-purple-400 bg-purple-500/5' },
    { key: 'duplicate', label: 'Duplicates', value: stats.duplicate, color: 'text-orange-400 bg-orange-500/5' },
    { key: 'rejected', label: 'Rejected', value: stats.rejected, color: 'text-rose-500 bg-rose-500/5' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <FiFolder className="text-brand-400" /> Question Content Library
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Enterprise repository management & classification catalog</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => { setEditingQuestion(null); setShowEditor(true); }}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20"
            >
              <FiPlus /> Create Question
            </button>
            <button
              onClick={() => { fetchStats(); if (activeTab === 'library') fetchQuestions(); else fetchAnalytics(); }}
              className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <FiRefreshCw className="text-sm" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-900 text-xs font-bold">
          <button
            onClick={() => setActiveTab('library')}
            className={`pb-3 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'library' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiGrid /> Questions Catalog
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'analytics' ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FiActivity /> Question Analytics
          </button>
        </div>

        {activeTab === 'library' ? (
          <>
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
              {cardItems.map(c => (
                <div
                  key={c.key}
                  onClick={() => setCardFilter(cardFilter === c.key ? '' : c.key)}
                  className={`border rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-all ${c.color} ${
                    cardFilter === c.key ? 'border-brand-500 ring-2 ring-brand-500/20 scale-[1.02]' : 'border-slate-800/60'
                  }`}
                >
                  <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{c.label}</div>
                  <div className="text-xl font-black text-white mt-1">{loadingStats ? '...' : c.value}</div>
                </div>
              ))}
            </div>

            {/* Filter controls section */}
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-44">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search query text, tags..."
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Exam select */}
                <MultiSelectFilter
                  label="Exam"
                  options={exams.map(e => ({ value: e._id, label: e.title }))}
                  selectedValues={selectedExams}
                  onChange={setSelectedExams}
                />

                {/* Phase select (requires 1 exam selected) */}
                {selectedExams.length === 1 && (
                  <MultiSelectFilter
                    label="Phase"
                    options={phases.map(p => ({ value: p._id, label: p.title }))}
                    selectedValues={selectedPhases}
                    onChange={setSelectedPhases}
                  />
                )}

                {/* Subject select (requires 1 phase selected) */}
                {selectedPhases.length === 1 && (
                  <MultiSelectFilter
                    label="Subject"
                    options={subjects.map(s => ({ value: s._id, label: s.title }))}
                    selectedValues={selectedSubjects}
                    onChange={setSelectedSubjects}
                  />
                )}

                {/* Topic select (requires 1 subject selected) */}
                {selectedSubjects.length === 1 && (
                  <MultiSelectFilter
                    label="Topic"
                    options={topics.map(t => ({ value: t._id, label: t.title }))}
                    selectedValues={selectedTopics}
                    onChange={setSelectedTopics}
                  />
                )}

                {/* Subtopic select (requires 1 topic selected) */}
                {selectedTopics.length === 1 && (
                  <MultiSelectFilter
                    label="Subtopic"
                    options={subtopics.map(st => ({ value: st._id, label: st.title }))}
                    selectedValues={selectedSubtopics}
                    onChange={setSelectedSubtopics}
                  />
                )}

                <MultiSelectFilter
                  label="Difficulty"
                  options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]}
                  selectedValues={selectedDiffs}
                  onChange={setSelectedDiffs}
                />

                <MultiSelectFilter
                  label="Type"
                  options={Object.entries(TYPE_LABELS_MAPPING).map(([k, v]) => ({ value: k, label: v }))}
                  selectedValues={selectedTypes}
                  onChange={setSelectedTypes}
                />

                <MultiSelectFilter
                  label="Status"
                  options={STATUS_OPTIONS_MAPPING}
                  selectedValues={selectedStatuses}
                  onChange={setSelectedStatuses}
                />

                {/* Clear all */}
                {(selectedExams.length > 0 || selectedDiffs.length > 0 || selectedTypes.length > 0 || selectedStatuses.length > 0 || search || cardFilter) && (
                  <button
                    onClick={() => {
                      setSelectedExams([]); setSelectedDiffs([]); setSelectedTypes([]); setSelectedStatuses([]);
                      setSelectedPhases([]); setSelectedSubjects([]); setSelectedTopics([]); setSelectedSubtopics([]);
                      setSearch(''); setCardFilter('');
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Bulk actions Floating Bar */}
            {selectedIds.length > 0 && (
              <div className="bg-[#121824] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xl shadow-brand-500/5 sticky top-4 z-30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-white">{selectedIds.length} questions selected</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => handleBulkAction('publish')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                    Publish Selected
                  </button>
                  <button onClick={() => handleBulkAction('archive')} className="bg-slate-700 hover:bg-slate-650 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                    Archive Selected
                  </button>
                  <button onClick={() => handleBulkAction('delete')} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                    Delete Selected
                  </button>
                  <button onClick={handleExportCSV} className="flex items-center gap-1 bg-dark-900 border border-slate-850 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all">
                    <FiDownload /> Export CSV
                  </button>
                  
                  {/* Topic Mover Dropdown helper */}
                  {selectedSubjects.length === 1 && (
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <select
                        value={bulkActionTarget}
                        onChange={e => setBulkActionTarget(e.target.value)}
                        className="bg-dark-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none"
                      >
                        <option value="">Move to Topic...</option>
                        {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                      </select>
                      <button
                        onClick={() => handleBulkAction('change_topic')}
                        disabled={!bulkActionTarget}
                        className="bg-brand-600 disabled:opacity-50 hover:bg-brand-500 text-white px-2.5 py-1.5 rounded-lg font-bold text-[11px]"
                      >
                        Go
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions Catalog Data Table */}
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl overflow-hidden min-h-[400px]">
              {loadingQuestions ? (
                <div className="flex items-center justify-center h-80">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-24 text-slate-500 space-y-2">
                  <FiAlertCircle className="text-2xl mx-auto text-slate-700" />
                  <p className="text-xs font-semibold">No questions found matching the selected parameters</p>
                  <button onClick={() => { setSearch(''); setSelectedExams([]); }} className="text-brand-400 text-[11px] hover:underline font-bold">Clear Filters</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 bg-dark-950/40 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <th className="px-5 py-3.5 w-10">
                          <button type="button" onClick={toggleSelectAll} className="text-slate-400">
                            {selectedIds.length === questions.length ? <FiCheckSquare className="text-brand-400 text-xs" /> : <FiSquare className="text-xs" />}
                          </button>
                        </th>
                        <th className="px-4 py-3.5">Question Contents</th>
                        <th className="px-4 py-3.5 w-32">Classification</th>
                        <th className="px-4 py-3.5 w-24">Type</th>
                        <th className="px-4 py-3.5 w-20">Difficulty</th>
                        <th className="px-4 py-3.5 w-20">Status</th>
                        <th className="px-5 py-3.5 w-20 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/55">
                      {questions.map(q => {
                        const isChecked = selectedIds.includes(q._id);
                        return (
                          <tr key={q._id} className={`hover:bg-dark-900/30 transition-all ${isChecked ? 'bg-brand-500/5' : ''}`}>
                            <td className="px-5 py-3.5">
                              <button type="button" onClick={() => toggleSelect(q._id)} className="text-slate-500 hover:text-white">
                                {isChecked ? <FiCheckSquare className="text-brand-400 text-xs" /> : <FiSquare className="text-xs" />}
                              </button>
                            </td>
                            <td className="px-4 py-3.5 max-w-sm">
                              <div className="line-clamp-2 text-slate-200 font-semibold" dangerouslySetInnerHTML={{ __html: q.questionText }} />
                              {q.tags && q.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {q.tags.map((t, i) => (
                                    <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.25 rounded font-mono font-medium">{t}</span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-400 font-medium">
                              <div className="font-bold text-slate-300">{q.examId?.title || '—'}</div>
                              <div className="text-[10px] mt-0.5 text-slate-500">{q.subjectId?.title || '—'}</div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-400 capitalize">{q.questionType?.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                q.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-500/10' :
                                q.difficulty === 'hard' ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10'
                              }`}>
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                q.qualityStatus === 'published' ? 'text-emerald-400 bg-emerald-500/10' :
                                q.qualityStatus === 'draft' ? 'text-slate-400 bg-slate-800/80' : 'text-indigo-400 bg-indigo-500/10'
                              }`}>
                                {q.qualityStatus}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-1.5">
                              <button onClick={() => setPreviewQuestion(q)} className="p-1 text-slate-500 hover:text-white transition-colors" title="Preview">
                                <FiEye className="text-sm" />
                              </button>
                              <button onClick={() => { setEditingQuestion(q); setShowEditor(true); }} className="p-1 text-slate-500 hover:text-white transition-colors" title="Edit">
                                <FiEdit2 className="text-sm" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalQuestions > limit && (
              <div className="flex items-center justify-between bg-dark-900/30 border border-slate-800/80 rounded-2xl p-4 text-xs">
                <span className="text-slate-500">
                  Showing <span className="font-bold text-slate-300">{(page - 1) * limit + 1}</span> to <span className="font-bold text-slate-300">{Math.min(page * limit, totalQuestions)}</span> of <span className="font-bold text-slate-300">{totalQuestions}</span> questions
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 rounded-xl bg-dark-900 border border-slate-850 text-slate-400 disabled:opacity-30 hover:text-white transition-all"
                  >
                    <FiChevronLeft />
                  </button>
                  <button
                    disabled={page * limit >= totalQuestions}
                    onClick={() => setPage(page + 1)}
                    className="p-2 rounded-xl bg-dark-900 border border-slate-850 text-slate-400 disabled:opacity-30 hover:text-white transition-all"
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Question Library Analytics tab view */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Difficulty Chart mock stats display */}
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiTrendingUp className="text-brand-400" /> Difficulty & Language Distribution
              </h3>
              {loadingAnalytics ? (
                <div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Difficulty Dist</span>
                    {analytics?.difficultyDistribution?.map(d => (
                      <div key={d._id} className="space-y-1">
                        <div className="flex justify-between font-bold font-mono text-[10px]">
                          <span className="capitalize">{d._id || 'Unspecified'}</span>
                          <span>{d.count}</span>
                        </div>
                        <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden">
                          <div className="bg-brand-500 h-full" style={{ width: `${Math.min(100, (d.count / stats.total) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Language Dist</span>
                    {analytics?.languageDistribution?.map(l => (
                      <div key={l._id} className="space-y-1">
                        <div className="flex justify-between font-bold font-mono text-[10px]">
                          <span className="capitalize">{l._id || 'Unspecified'}</span>
                          <span>{l.count}</span>
                        </div>
                        <div className="w-full bg-slate-800/60 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, (l.count / stats.total) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Exam Distribution list */}
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiTarget className="text-cyan-400" /> Exam Allocation Distribution
              </h3>
              {loadingAnalytics ? (
                <div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                  {analytics?.examDistribution?.map(e => (
                    <div key={e._id} className="flex justify-between items-center bg-slate-900/30 border border-slate-850/60 p-2 rounded-lg text-[10px]">
                      <span className="font-semibold text-slate-300">{e.title || 'Other/General'}</span>
                      <span className="bg-cyan-500/10 text-cyan-400 font-black px-2 py-0.5 rounded font-mono">{e.count} Qs</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shortage warning report */}
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiAlertCircle className="text-rose-400" /> Topic Shortage Warning Board
              </h3>
              <p className="text-[10px] text-slate-500">Showing syllabus topics containing fewer than 5 practice questions.</p>
              {loadingAnalytics ? (
                <div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : analytics?.shortageTopics?.length === 0 ? (
                <div className="text-center py-10 text-slate-600 font-bold text-[10px]">🎉 No shortage detected! All topics have 5+ questions.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-2">
                  {analytics?.shortageTopics?.map(s => (
                    <div key={s.topicId} className="bg-rose-500/5 border border-rose-500/15 p-3 rounded-xl flex items-center justify-between text-[10px]">
                      <div>
                        <div className="font-bold text-slate-200">{s.topicTitle}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Exam: {s.examTitle}</div>
                      </div>
                      <span className="bg-rose-500/20 text-rose-400 font-black px-2 py-0.5 rounded font-mono">
                        {s.count} / 5
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duplicate detection table */}
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FiSettings className="text-orange-400" /> Duplicate Question Groupings
              </h3>
              {loadingAnalytics ? (
                <div className="h-40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
              ) : analytics?.duplicates?.length === 0 ? (
                <div className="text-center py-10 text-slate-600 font-bold text-[10px]">✅ Clean database integrity. No duplicate hashes found.</div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {analytics?.duplicates?.map((dup, idx) => (
                    <div key={idx} className="bg-dark-900 border border-slate-850 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-mono">Hash: {dup._id.slice(0, 40)}...</span>
                        <span className="bg-orange-500/10 text-orange-400 font-bold px-1.5 py-0.25 rounded">{dup.count} Duplicates</span>
                      </div>
                      <div className="divide-y divide-slate-850">
                        {dup.questions.map(q => (
                          <div key={q._id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-[10px]">
                            <div className="line-clamp-1 text-slate-300 flex-1 font-medium">{q.questionText}</div>
                            <span className="text-slate-500 font-mono shrink-0">ID: {q._id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Editor Modal */}
      {showEditor && (
        <QuestionEditorModal
          question={editingQuestion}
          onClose={() => { setShowEditor(false); setEditingQuestion(null); }}
          onSaveSuccess={() => { setShowEditor(false); setEditingQuestion(null); fetchStats(); fetchQuestions(); }}
        />
      )}

      {/* Preview Modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}

    </div>
  );
}

// ─── Constants Mappings ───
const TYPE_LABELS_MAPPING = {
  mcq: 'Multiple Choice (Single)',
  multiple_select: 'Multiple Choice (Multiple Correct)',
  true_false: 'True / False',
  assertion_reason: 'Assertion - Reason',
  match_the_following: 'Match the Following',
  statement_based: 'Statement Based',
  passage_based: 'Passage Based',
  numerical: 'Numerical Answer',
  descriptive: 'Descriptive/Written',
  interview: 'Interview Question',
  case_study: 'Case Study',
};

const STATUS_OPTIONS_MAPPING = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];
