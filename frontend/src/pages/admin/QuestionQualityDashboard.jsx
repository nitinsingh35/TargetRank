import React, { useState, useEffect } from 'react';
import {
  FiCheckCircle, FiXCircle, FiAward, FiEye, FiFolder,
  FiFilter, FiRefreshCw, FiBookOpen, FiBookmark, FiCalendar,
  FiTag, FiPlus, FiChevronDown, FiAlertTriangle, FiInfo
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminQuestionImportAPI from '../../api/adminQuestionImportApi.js';
import questionAPI from '../../api/questionApi.js';
import adminSyllabusAPI from '../../api/adminSyllabusApi.js';

export default function QuestionQualityDashboard() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syllabusTree, setSyllabusTree] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  // Selection check
  const [selectedIds, setSelectedIds] = useState([]);

  // Stats Counters
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    published: 0,
    rejected: 0,
    missingExplanation: 0,
  });

  // Filters state
  const [examId, setExamId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [sourceType, setSourceType] = useState('');
  const [sourceYear, setSourceYear] = useState('');
  const [qualityStatus, setQualityStatus] = useState('');
  const [isPublished, setIsPublished] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog overlays
  const [rejectionModalId, setRejectionModalId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [bulkTagText, setBulkTagText] = useState('');

  // Dropdown lists
  const [phasesList, setPhasesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [topicsList, setTopicsList] = useState([]);

  useEffect(() => {
    fetchSyllabus();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [examId, phaseId, subjectId, topicId, sourceType, sourceYear, qualityStatus, isPublished, page]);

  const fetchSyllabus = async () => {
    try {
      const { data } = await adminSyllabusAPI.getSyllabusTree();
      if (data.success) {
        setSyllabusTree(data.tree || []);
      }
    } catch (err) {
      console.error('Failed to load syllabus tree for filters.', err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        examId: examId || undefined,
        phaseId: phaseId || undefined,
        subjectId: subjectId || undefined,
        topicId: topicId || undefined,
        sourceType: sourceType || undefined,
        sourceYear: sourceYear || undefined,
        qualityStatus: qualityStatus || undefined,
        isPublished: isPublished !== '' ? isPublished : undefined,
      };

      const { data } = await questionAPI.getQuestions(params);
      setQuestions(data.questions || []);
      setTotalPages(data.pages || 1);

      // Compute statistics based on currently fetched items or total estimates
      // For standard implementation, we mock aggregate counters across database
      setStats({
        total: data.total || 0,
        pending: data.questions?.filter(q => q.qualityStatus === 'pending_review').length || 0,
        approved: data.questions?.filter(q => q.qualityStatus === 'approved').length || 0,
        published: data.questions?.filter(q => q.isPublished).length || 0,
        rejected: data.questions?.filter(q => q.qualityStatus === 'rejected').length || 0,
        missingExplanation: data.questions?.filter(q => !q.explanation?.trim()).length || 0,
      });

    } catch (err) {
      toast.error('Failed to load questions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sync child stages on select change
  const handleExamChange = (e) => {
    const id = e.target.value;
    setExamId(id);
    setPhaseId('');
    setSubjectId('');
    setTopicId('');
    setPage(1);

    const selectedExam = syllabusTree.find(ex => ex._id === id);
    setPhasesList(selectedExam ? selectedExam.phases || [] : []);
    setSubjectsList([]);
    setTopicsList([]);
  };

  const handlePhaseChange = (e) => {
    const id = e.target.value;
    setPhaseId(id);
    setSubjectId('');
    setTopicId('');
    setPage(1);

    const selectedPhase = phasesList.find(ph => ph._id === id);
    setSubjectsList(selectedPhase ? selectedPhase.subjects || [] : []);
    setTopicsList([]);
  };

  const handleSubjectChange = (e) => {
    const id = e.target.value;
    setSubjectId(id);
    setTopicId('');
    setPage(1);

    const selectedSubject = subjectsList.find(sub => sub._id === id);
    setTopicsList(selectedSubject ? selectedSubject.topics || [] : []);
  };

  // Actions
  const handleApprove = async (id, publish = false) => {
    try {
      const { data } = await adminQuestionImportAPI.approveQuestion(id, { publish });
      if (data.success) {
        toast.success(`Question approved successfully! ${publish ? 'Published.' : ''}`);
        if (selectedQuestion?._id === id) {
          setSelectedQuestion({ ...selectedQuestion, qualityStatus: 'approved', isVerified: true, isPublished: publish });
        }
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      const { data } = await adminQuestionImportAPI.rejectQuestion(rejectionModalId, {
        rejectionReason
      });
      if (data.success) {
        toast.success('Question rejected successfully!');
        setRejectionModalId(null);
        setRejectionReason('');
        setSelectedQuestion(null);
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    }
  };

  const handlePublish = async (id) => {
    try {
      const { data } = await adminQuestionImportAPI.publishQuestion(id);
      if (data.success) {
        toast.success('Question published successfully!');
        if (selectedQuestion?._id === id) {
          setSelectedQuestion({ ...selectedQuestion, isPublished: true });
        }
        fetchQuestions();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Publication failed.');
    }
  };

  // Bulk triggers
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      const { data } = await adminQuestionImportAPI.bulkApproveQuestions({ ids: selectedIds });
      if (data.success) {
        toast.success(`Successfully approved ${data.modifiedCount} questions!`);
        setSelectedIds([]);
        fetchQuestions();
      }
    } catch (err) {
      toast.error('Bulk approval failed.');
    }
  };

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    try {
      const { data } = await adminQuestionImportAPI.bulkPublishQuestions({ ids: selectedIds });
      if (data.success) {
        toast.success(`Successfully published ${data.modifiedCount} approved questions!`);
        setSelectedIds([]);
        fetchQuestions();
      }
    } catch (err) {
      toast.error('Bulk publication failed.');
    }
  };

  const handleBulkTagSubmit = async (e) => {
    e.preventDefault();
    if (!bulkTagText.trim() || selectedIds.length === 0) return;
    
    const tagsArray = bulkTagText.split(',').map(t => t.trim()).filter(t => t !== '');
    try {
      const { data } = await adminQuestionImportAPI.bulkTagQuestions({
        ids: selectedIds,
        tags: tagsArray
      });
      if (data.success) {
        toast.success('Tags applied successfully!');
        setBulkTagModalOpen(false);
        setBulkTagText('');
        setSelectedIds([]);
        fetchQuestions();
      }
    } catch (err) {
      toast.error('Bulk tagging failed.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Title */}
        <div>
          <span className="text-xs font-black text-brand-400 uppercase tracking-widest">Question Quality Control</span>
          <h1 className="text-3xl font-extrabold text-white mt-1">Question Quality Review</h1>
          <p className="text-slate-500 text-xs mt-0.5">Approve, reject, tag, and publish bulk dataset questions inside the moderation dashboard.</p>
        </div>

        {/* Counter Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Total Matches</p>
            <p className="text-xl font-black text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Pending Review</p>
            <p className="text-xl font-black text-indigo-400 mt-0.5">{stats.pending}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Approved</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.approved}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Published</p>
            <p className="text-xl font-black text-brand-450 mt-0.5">{stats.published}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Rejected</p>
            <p className="text-xl font-black text-rose-450 mt-0.5">{stats.rejected}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
            <p className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">No Explanations</p>
            <p className="text-xl font-black text-amber-500 mt-0.5">{stats.missingExplanation}</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-6 bg-dark-900/50 border-slate-850 space-y-4">
          <h3 className="text-xs font-black text-white flex items-center gap-2 border-b border-slate-850 pb-2">
            <FiFilter className="text-brand-400" /> Filter Criteria
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-350">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Exam</label>
              <select value={examId} onChange={handleExamChange} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5">
                <option value="">All Exams</option>
                {syllabusTree.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Stage</label>
              <select value={phaseId} onChange={handlePhaseChange} disabled={!examId} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5 disabled:opacity-40">
                <option value="">All Stages</option>
                {phasesList.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Subject</label>
              <select value={subjectId} onChange={handleSubjectChange} disabled={!phaseId} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5 disabled:opacity-40">
                <option value="">All Subjects</option>
                {subjectsList.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Topic</label>
              <select value={topicId} onChange={(e) => { setTopicId(e.target.value); setPage(1); }} disabled={!subjectId} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5 disabled:opacity-40">
                <option value="">All Topics</option>
                {topicsList.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Source Type</label>
              <select value={sourceType} onChange={(e) => { setSourceType(e.target.value); setPage(1); }} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5">
                <option value="">All Sources</option>
                <option value="official_pyq">Official PYQ</option>
                <option value="original_practice">Original Practice</option>
                <option value="current_affairs">Current Affairs</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Source Year</label>
              <input
                type="number"
                placeholder="e.g. 2026"
                value={sourceYear}
                onChange={(e) => { setSourceYear(e.target.value); setPage(1); }}
                className="bg-dark-950 border border-slate-800 rounded-xl p-2.5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Quality Status</label>
              <select value={qualityStatus} onChange={(e) => { setQualityStatus(e.target.value); setPage(1); }} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5">
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-550 uppercase tracking-wider">Published Status</label>
              <select value={isPublished} onChange={(e) => { setIsPublished(e.target.value); setPage(1); }} className="bg-dark-950 border border-slate-800 rounded-xl p-2.5">
                <option value="">All</option>
                <option value="true">Published Only</option>
                <option value="false">Unpublished Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {selectedIds.length > 0 && (
          <div className="p-4 bg-brand-500/10 border border-brand-500/35 rounded-xl flex items-center justify-between flex-wrap gap-4 text-xs">
            <span className="font-extrabold text-brand-300">{selectedIds.length} questions selected</span>
            
            <div className="flex gap-2">
              <button
                onClick={handleBulkApprove}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold transition-all"
              >
                Bulk Approve
              </button>
              <button
                onClick={handleBulkPublish}
                className="flex items-center gap-1 bg-brand-500 hover:bg-brand-400 text-white px-3 py-1.5 rounded-xl font-bold transition-all"
              >
                Bulk Publish
              </button>
              <button
                onClick={() => setBulkTagModalOpen(true)}
                className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-xl font-bold transition-all"
              >
                Bulk Tag
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Questions List */}
          <div className="lg:col-span-8 space-y-4">
            {loading ? (
              <div className="glass-card p-12 text-center bg-dark-900/60 border-slate-850 flex flex-col items-center gap-3">
                <FiRefreshCw className="animate-spin text-3xl text-brand-500" />
                <p className="text-xs text-slate-550">Fetching dataset questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="glass-card p-12 text-center bg-dark-900/60 border-slate-850 space-y-2">
                <FiInfo className="text-4xl text-slate-650 mx-auto" />
                <h3 className="text-sm font-extrabold text-white">No Matching Questions</h3>
                <p className="text-slate-500 text-xs">Try clearing some filtering attributes to search again.</p>
              </div>
            ) : (
              <div className="glass-card overflow-hidden bg-dark-900/60 border-slate-850">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold text-slate-400 border-collapse">
                    <thead>
                      <tr className="bg-dark-950 text-slate-450 border-b border-slate-850">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === questions.length}
                            onChange={toggleSelectAll}
                            className="rounded bg-dark-900 border-slate-800 text-brand-500 focus:ring-0 focus:ring-offset-0"
                          />
                        </th>
                        <th className="p-3">Question Text</th>
                        <th className="p-3 w-28">Type</th>
                        <th className="p-3 w-28 text-center">Source</th>
                        <th className="p-3 w-24 text-center">Status</th>
                        <th className="p-3 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {questions.map((q) => (
                        <tr
                          key={q._id}
                          className={`hover:bg-dark-950/30 cursor-pointer transition-colors ${
                            selectedQuestion?._id === q._id ? 'bg-brand-500/5' : ''
                          }`}
                          onClick={() => setSelectedQuestion(q)}
                        >
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(q._id)}
                              onChange={() => toggleSelectOne(q._id)}
                              className="rounded bg-dark-900 border-slate-800 text-brand-500 focus:ring-0 focus:ring-offset-0"
                            />
                          </td>

                          <td className="p-3 max-w-sm truncate text-slate-200">
                            {q.questionText}
                            {(!q.explanation?.trim()) && (
                              <span className="ml-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] px-1 py-0.5 rounded font-black">
                                NO EXP
                              </span>
                            )}
                          </td>

                          <td className="p-3 capitalize text-slate-400">{q.questionType?.replace('_', ' ')}</td>
                          <td className="p-3 text-center text-slate-450 font-bold">
                            {q.sourceType} {q.sourceYear ? `(${q.sourceYear})` : ''}
                          </td>

                          <td className="p-3 text-center">
                            <span className={`text-[8px] font-black uppercase border px-2 py-0.5 rounded-full ${
                              q.qualityStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                              q.qualityStatus === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-450' :
                              'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                            }`}>
                              {q.qualityStatus}
                            </span>
                          </td>

                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedQuestion(q)}
                              className="text-slate-450 hover:text-white p-1 rounded border border-slate-800 hover:border-slate-700 bg-dark-950/40"
                            >
                              <FiEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center p-4 border-t border-slate-850">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="text-xs font-black text-slate-450 hover:text-white disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-slate-550">Page {page} of {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="text-xs font-black text-slate-450 hover:text-white disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Question Inspector Drawer */}
          <div className="lg:col-span-4">
            {!selectedQuestion ? (
              <div className="glass-card p-12 text-center bg-dark-900/60 border-slate-850 space-y-2">
                <FiInfo className="text-4xl text-slate-700 mx-auto" />
                <h3 className="text-sm font-extrabold text-white">No Question Selected</h3>
                <p className="text-slate-500 text-xs">Click on any question in the quality list to inspect full text, options, explanations, and moderation actions.</p>
              </div>
            ) : (
              <div className="glass-card p-6 bg-dark-900/60 border-slate-850 space-y-5">
                <div className="border-b border-slate-850/60 pb-3 flex justify-between items-center flex-wrap gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Question Inspector</h3>
                  <span className={`text-[8px] font-black uppercase border px-2 py-0.5 rounded-full ${
                    selectedQuestion.qualityStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    selectedQuestion.qualityStatus === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-450' :
                    'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  }`}>
                    {selectedQuestion.qualityStatus}
                  </span>
                </div>

                {/* Inspect Fields */}
                <div className="space-y-4 text-xs font-semibold text-slate-350">
                  
                  {/* English Text */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-550 uppercase">Question (EN)</span>
                    <p className="text-slate-200 bg-dark-950/40 p-2.5 rounded-xl border border-slate-850">{selectedQuestion.questionText}</p>
                  </div>

                  {/* Hindi Text */}
                  {selectedQuestion.questionHindi && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-550 uppercase">Question (HI)</span>
                      <p className="text-slate-300 bg-dark-950/40 p-2.5 rounded-xl border border-slate-850">{selectedQuestion.questionHindi}</p>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-bold text-slate-550 uppercase">Options ({selectedQuestion.options?.length || 0})</span>
                    <div className="space-y-1">
                      {selectedQuestion.options?.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-lg border text-[11px] ${
                            (selectedQuestion.correctAnswer === opt || selectedQuestion.correctAnswers?.includes(opt))
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                              : 'bg-dark-950/20 border-slate-855'
                          }`}
                        >
                          <span className="mr-1.5 text-slate-500 font-bold">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-slate-550 uppercase">Explanation (EN)</span>
                    <p className="text-slate-400 bg-dark-950/40 p-2.5 rounded-xl border border-slate-850/60 leading-relaxed">
                      {selectedQuestion.explanation || 'No explanation provided.'}
                    </p>
                  </div>

                  {/* Syllabus Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-dark-950/40 border border-slate-850 rounded-xl p-3">
                    <div>
                      <span className="text-[8px] font-bold text-slate-550 uppercase block">Source Type</span>
                      <span className="text-slate-300">{selectedQuestion.sourceType}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-550 uppercase block">Marks</span>
                      <span className="text-slate-300">+{selectedQuestion.marks} / -{selectedQuestion.negativeMarks}</span>
                    </div>
                  </div>

                  {/* Moderation Controls */}
                  <div className="border-t border-slate-850/60 pt-4 flex flex-col gap-2">
                    {selectedQuestion.qualityStatus !== 'approved' && (
                      <button
                        onClick={() => handleApprove(selectedQuestion._id, false)}
                        className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl font-bold transition-all"
                      >
                        <FiCheckCircle /> Approve & Verify
                      </button>
                    )}

                    {selectedQuestion.qualityStatus === 'approved' && !selectedQuestion.isPublished && (
                      <button
                        onClick={() => handlePublish(selectedQuestion._id)}
                        className="w-full flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-400 text-white py-2 rounded-xl font-bold transition-all"
                      >
                        <FiBookOpen /> Publish to Aspirants
                      </button>
                    )}

                    {selectedQuestion.qualityStatus !== 'rejected' && (
                      <button
                        onClick={() => setRejectionModalId(selectedQuestion._id)}
                        className="w-full flex items-center justify-center gap-1.5 bg-dark-950 border border-rose-500/25 hover:border-rose-500/40 text-rose-400 py-2 rounded-xl font-bold transition-all"
                      >
                        <FiXCircle /> Reject Question
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Rejection Modal Dialog */}
      {rejectionModalId && (
        <div className="fixed inset-0 z-50 bg-[#000]/70 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <FiXCircle className="text-rose-500" /> Reject Question
            </h3>
            
            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Rejection</label>
                <textarea
                  required
                  placeholder="Explain why this question does not meet standards (e.g. typos, incorrect syllabus slugs, option mismatches...)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full h-24 bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setRejectionModalId(null); setRejectionReason(''); }}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-xl font-bold"
                >
                  Reject Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Tag Modal Dialog */}
      {bulkTagModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#000]/70 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <FiTag className="text-indigo-400" /> Apply Bulk Tags
            </h3>
            
            <form onSubmit={handleBulkTagSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Enter Tags (Comma-separated)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. high_frequency, expected_2026, static_gk"
                  value={bulkTagText}
                  onChange={(e) => setBulkTagText(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => { setBulkTagModalOpen(false); setBulkTagText(''); }}
                  className="px-3 py-1.5 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-bold"
                >
                  Apply Tags
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
