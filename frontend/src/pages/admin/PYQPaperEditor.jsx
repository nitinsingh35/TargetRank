import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronRight, FiChevronLeft, FiCheckCircle, FiAlertCircle,
  FiSearch, FiX, FiMove, FiAward, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';
import examAPI from '../../api/examApi.js';
import API from '../../api/api.js';
import AdminSidebar from './AdminSidebar.jsx';

const STEPS = ['Basic Details', 'Paper Pattern', 'Official Source', 'Link Questions', 'Instructions & Validation'];

export default function PYQPaperEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [validationReport, setValidationReport] = useState(null);
  const [validating, setValidating] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [form, setForm] = useState({
    title: '', examId: '', phaseId: '', year: new Date().getFullYear(),
    paperName: '', paperCode: '', paperType: 'prelims', language: 'english',
    durationMinutes: 120, totalQuestions: 0, totalMarks: 0,
    negativeMarkingEnabled: false, defaultNegativeMarks: 0.66, attemptLimit: 1,
    officialSourceName: '', officialSourceUrl: '', officialAnswerKeyUrl: '',
    sourceVerified: false,
    questionIds: [],
    instructions: '', instructionsHindi: '',
  });

  useEffect(() => {
    loadExams();
    if (isEditing) loadPaper();
  }, [id]);

  useEffect(() => {
    if (form.examId) {
      const ex = exams.find(e => e._id === form.examId);
      setPhases(ex?.phases || []);
    }
  }, [form.examId, exams]);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) { console.error(err); }
  };

  const loadPaper = async () => {
    try {
      const { data } = await pyqAPI.adminGetPYQPaper(id);
      const paper = data;
      setForm({
        title: paper.title || '',
        examId: paper.examId?._id || paper.examId || '',
        phaseId: paper.phaseId?._id || paper.phaseId || '',
        year: paper.year || new Date().getFullYear(),
        paperName: paper.paperName || '',
        paperCode: paper.paperCode || '',
        paperType: paper.paperType || 'prelims',
        language: paper.language || 'english',
        durationMinutes: paper.durationMinutes || 120,
        totalQuestions: paper.totalQuestions || 0,
        totalMarks: paper.totalMarks || 0,
        negativeMarkingEnabled: paper.negativeMarkingEnabled || false,
        defaultNegativeMarks: paper.defaultNegativeMarks || 0.66,
        attemptLimit: paper.attemptLimit || 1,
        officialSourceName: paper.officialSourceName || '',
        officialSourceUrl: paper.officialSourceUrl || '',
        officialAnswerKeyUrl: paper.officialAnswerKeyUrl || '',
        sourceVerified: paper.sourceVerified || false,
        questionIds: (paper.questionIds || []).map(q => q._id ? q : { _id: q }),
        instructions: paper.instructions || '',
        instructionsHindi: paper.instructionsHindi || '',
      });
    } catch (err) {
      toast.error('Failed to load PYQ paper.');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title || !form.examId || !form.year || !form.paperName || !form.officialSourceName || !form.officialSourceUrl) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        questionIds: form.questionIds.map(q => q._id || q),
      };
      if (isEditing) {
        await pyqAPI.adminUpdatePYQPaper(id, payload);
        toast.success('PYQ Paper updated!');
      } else {
        const { data } = await pyqAPI.adminCreatePYQPaper(payload);
        toast.success('PYQ Paper created!');
        navigate(`/admin/pyq-papers/${data.paper._id}/edit`);
        return;
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!id) { toast.error('Save the paper first.'); return; }
    setValidating(true);
    try {
      const { data } = await pyqAPI.adminValidatePYQPaper(id);
      setValidationReport(data);
    } catch (err) {
      toast.error('Validation failed.');
    } finally {
      setValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!id) { toast.error('Save the paper first.'); return; }
    if (!validationReport?.canPublish) {
      toast.error('Validate the paper successfully before publishing.');
      return;
    }
    setPublishing(true);
    try {
      await pyqAPI.adminPublishPYQPaper(id);
      toast.success('PYQ Paper published!');
      navigate('/admin/pyq-papers');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  const searchQuestions = async () => {
    if (!questionSearch.trim() && !form.examId) return;
    setSearching(true);
    try {
      const params = {
        sourceType: 'official_pyq',
        qualityStatus: 'approved',
        limit: 30,
      };
      if (form.examId) params.examId = form.examId;
      if (form.phaseId) params.phaseId = form.phaseId;
      if (form.year) params.sourceYear = form.year;
      if (form.paperName) params.paperName = form.paperName;
      if (questionSearch.trim()) params.search = questionSearch.trim();

      const { data } = await API.get('/questions', { params });
      const currentIds = new Set(form.questionIds.map(q => (q._id || q).toString()));
      setSearchResults((data.questions || []).filter(q => !currentIds.has(q._id.toString())));
    } catch (err) {
      toast.error('Question search failed.');
    } finally {
      setSearching(false);
    }
  };

  const addQuestion = (q) => {
    if (form.questionIds.find(item => (item._id || item).toString() === q._id.toString())) {
      toast.error('Question already linked.');
      return;
    }
    setForm(prev => ({
      ...prev,
      questionIds: [...prev.questionIds, q],
    }));
    setSearchResults(prev => prev.filter(item => item._id !== q._id));
  };

  const removeQuestion = (qId) => {
    setForm(prev => ({
      ...prev,
      questionIds: prev.questionIds.filter(q => (q._id || q).toString() !== qId.toString()),
    }));
  };

  const moveQuestion = (idx, dir) => {
    const arr = [...form.questionIds];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= arr.length) return;
    [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
    setForm(prev => ({ ...prev, questionIds: arr }));
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiAward className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
              {isEditing ? 'Edit PYQ Paper' : 'Create PYQ Paper'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            {isEditing ? 'Edit PYQ Paper' : 'New PYQ Paper'}
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar active="PYQ Papers" />

          <div className="flex-1 space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
              {STEPS.map((s, idx) => (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => setCurrentStep(idx)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      currentStep === idx
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      currentStep === idx ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                    }`}>{idx + 1}</span>
                    {s}
                  </button>
                  {idx < STEPS.length - 1 && <FiChevronRight className="text-slate-700 shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">

              {/* Step 1: Basic Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Basic Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Paper Title *</label>
                      <input
                        value={form.title}
                        onChange={e => handleChange('title', e.target.value)}
                        placeholder="e.g. UPSC CSE Prelims 2024 – GS Paper I"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Exam *</label>
                      <select
                        value={form.examId}
                        onChange={e => handleChange('examId', e.target.value)}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      >
                        <option value="">Select Exam</option>
                        {exams.map(e => (
                          <option key={e._id} value={e._id}>{e.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Phase / Stage</label>
                      <select
                        value={form.phaseId}
                        onChange={e => handleChange('phaseId', e.target.value)}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        disabled={!form.examId}
                      >
                        <option value="">Select Phase (Optional)</option>
                        {phases.map(p => (
                          <option key={p._id} value={p._id}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Year *</label>
                      <input
                        type="number"
                        value={form.year}
                        onChange={e => handleChange('year', Number(e.target.value))}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        min={1990}
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Paper Name *</label>
                      <input
                        value={form.paperName}
                        onChange={e => handleChange('paperName', e.target.value)}
                        placeholder="e.g. GS Paper I"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Paper Code</label>
                      <input
                        value={form.paperCode}
                        onChange={e => handleChange('paperCode', e.target.value)}
                        placeholder="Optional code"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Paper Type *</label>
                      <select
                        value={form.paperType}
                        onChange={e => handleChange('paperType', e.target.value)}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      >
                        <option value="prelims">Prelims</option>
                        <option value="mains">Mains</option>
                        <option value="tier_1">Tier I</option>
                        <option value="tier_2">Tier II</option>
                        <option value="descriptive">Descriptive</option>
                        <option value="interview">Interview</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Language *</label>
                      <select
                        value={form.language}
                        onChange={e => handleChange('language', e.target.value)}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      >
                        <option value="english">English</option>
                        <option value="hindi">Hindi</option>
                        <option value="bilingual">Bilingual</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Paper Pattern */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Paper Pattern</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Duration (minutes) *</label>
                      <input
                        type="number"
                        value={form.durationMinutes}
                        onChange={e => handleChange('durationMinutes', Number(e.target.value))}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        min={10}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Attempt Limit</label>
                      <input
                        type="number"
                        value={form.attemptLimit}
                        onChange={e => handleChange('attemptLimit', Number(e.target.value))}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Total Questions (auto-calculated from linked)</label>
                      <input
                        type="number"
                        value={form.questionIds.length}
                        readOnly
                        className="w-full bg-dark-800/50 border border-slate-700 text-slate-400 text-sm rounded-xl px-3 py-2.5 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Total Marks (auto-calculated)</label>
                      <input
                        type="number"
                        value={form.totalMarks}
                        onChange={e => handleChange('totalMarks', Number(e.target.value))}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="negativeMarking"
                        checked={form.negativeMarkingEnabled}
                        onChange={e => handleChange('negativeMarkingEnabled', e.target.checked)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <label htmlFor="negativeMarking" className="text-sm text-slate-300 font-medium">Enable Negative Marking</label>
                    </div>
                    {form.negativeMarkingEnabled && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Default Negative Marks</label>
                        <input
                          type="number"
                          step="0.01"
                          value={form.defaultNegativeMarks}
                          onChange={e => handleChange('defaultNegativeMarks', Number(e.target.value))}
                          className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                          min={0}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Official Source */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Official Source Details</h2>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                    <FiAlertCircle className="inline mr-1.5" />
                    Only use officially released papers, official answer keys, and properly licensed material. Never upload copyrighted or pirated content.
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Official Source Name *</label>
                      <input
                        value={form.officialSourceName}
                        onChange={e => handleChange('officialSourceName', e.target.value)}
                        placeholder="e.g. UPSC Official Website, SSC Official Portal"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Official Source URL *</label>
                      <div className="flex gap-2">
                        <input
                          value={form.officialSourceUrl}
                          onChange={e => handleChange('officialSourceUrl', e.target.value)}
                          placeholder="https://upsc.gov.in/..."
                          className="flex-1 bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        />
                        {form.officialSourceUrl && (
                          <a href={form.officialSourceUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl">
                            <FiExternalLink className="text-xs" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Official Answer Key URL</label>
                      <div className="flex gap-2">
                        <input
                          value={form.officialAnswerKeyUrl}
                          onChange={e => handleChange('officialAnswerKeyUrl', e.target.value)}
                          placeholder="Optional — answer key link"
                          className="flex-1 bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        />
                        {form.officialAnswerKeyUrl && (
                          <a href={form.officialAnswerKeyUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl">
                            <FiExternalLink className="text-xs" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-dark-800 border border-slate-700 rounded-xl">
                      <input
                        type="checkbox"
                        id="sourceVerified"
                        checked={form.sourceVerified}
                        onChange={e => handleChange('sourceVerified', e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 mt-0.5 shrink-0"
                      />
                      <div>
                        <label htmlFor="sourceVerified" className="text-sm text-slate-200 font-semibold cursor-pointer">I confirm this is an officially released, verified paper</label>
                        <p className="text-xs text-slate-500 mt-0.5">This paper must be officially published. You are verifying it as admin. This is required before publishing.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Link Questions */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Link Questions</h2>
                  <p className="text-xs text-slate-500">Only approved official PYQ questions with matching exam, year, and paper name will appear.</p>

                  {/* Search */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                      <input
                        value={questionSearch}
                        onChange={e => setQuestionSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchQuestions()}
                        placeholder="Search approved official PYQ questions…"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl pl-9 pr-3 py-2.5"
                      />
                    </div>
                    <button
                      onClick={searchQuestions}
                      disabled={searching}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-all"
                    >
                      {searching ? '…' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="bg-dark-800 border border-slate-700 rounded-xl divide-y divide-slate-700 max-h-60 overflow-y-auto">
                      {searchResults.map(q => (
                        <div key={q._id} className="px-3 py-2.5 flex items-start gap-3 hover:bg-dark-700 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 line-clamp-2">{q.questionText}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {q.subjectId?.title} • {q.topicId?.title} • {q.marks}M / {q.negativeMarks}NM
                            </p>
                          </div>
                          <button
                            onClick={() => addQuestion(q)}
                            className="shrink-0 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-bold rounded-lg transition-all"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Linked Questions */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white">Linked Questions <span className="text-amber-400">({form.questionIds.length})</span></h3>
                      <p className="text-xs text-slate-500">Drag or use arrows to reorder</p>
                    </div>
                    {form.questionIds.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-slate-700 rounded-xl">
                        <FiMove className="text-slate-600 text-2xl mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No questions linked yet. Search and add above.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-96 overflow-y-auto">
                        {form.questionIds.map((q, idx) => {
                          const qData = q._id ? q : { _id: q, questionText: `Question ID: ${q}` };
                          return (
                            <div key={qData._id?.toString() || idx} className="flex items-center gap-2 p-2.5 bg-dark-800 border border-slate-700 rounded-xl">
                              <span className="text-xs text-slate-600 w-6 text-center font-bold shrink-0">{idx + 1}</span>
                              <p className="flex-1 text-xs text-slate-300 line-clamp-1">
                                {qData.questionText || `Question ID: ${qData._id}`}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => moveQuestion(idx, -1)}
                                  disabled={idx === 0}
                                  className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                                >▲</button>
                                <button
                                  onClick={() => moveQuestion(idx, 1)}
                                  disabled={idx === form.questionIds.length - 1}
                                  className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-30"
                                >▼</button>
                                <button
                                  onClick={() => removeQuestion(qData._id)}
                                  className="p-1 rounded text-rose-500 hover:text-rose-400"
                                >
                                  <FiX className="text-xs" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Instructions & Validation */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-white">Instructions & Validation</h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Instructions (English)</label>
                    <textarea
                      value={form.instructions}
                      onChange={e => handleChange('instructions', e.target.value)}
                      rows={4}
                      placeholder="Add exam instructions visible to aspirants before starting..."
                      className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Instructions (Hindi)</label>
                    <textarea
                      value={form.instructionsHindi}
                      onChange={e => handleChange('instructionsHindi', e.target.value)}
                      rows={4}
                      placeholder="हिंदी में निर्देश..."
                      className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 resize-none"
                    />
                  </div>

                  {/* Validation Panel */}
                  <div className="bg-dark-800 border border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Validation Report</h3>
                      <button
                        onClick={handleValidate}
                        disabled={validating || !id}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                      >
                        {validating ? 'Running…' : 'Run Validation'}
                      </button>
                    </div>

                    {!validationReport && (
                      <p className="text-xs text-slate-500">Click "Run Validation" to check all questions before publishing.</p>
                    )}

                    {validationReport && (
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${validationReport.canPublish ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                          {validationReport.canPublish
                            ? <FiCheckCircle className="text-emerald-400" />
                            : <FiAlertCircle className="text-rose-400" />}
                          <span className={`text-sm font-semibold ${validationReport.canPublish ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {validationReport.canPublish ? 'Ready to Publish' : 'Cannot Publish — Issues Found'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            ['Total Linked', validationReport.totalLinked, 'text-slate-300'],
                            ['Valid', validationReport.validQuestions, 'text-emerald-400'],
                            ['Missing', validationReport.missingQuestions, 'text-rose-400'],
                            ['Unverified', validationReport.unverifiedQuestions, 'text-amber-400'],
                          ].map(([label, val, color]) => (
                            <div key={label} className="bg-dark-900 rounded-lg p-2.5 text-center">
                              <p className={`text-lg font-black ${color}`}>{val}</p>
                              <p className="text-[10px] text-slate-500">{label}</p>
                            </div>
                          ))}
                        </div>
                        {validationReport.errors?.length > 0 && (
                          <div className="bg-dark-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                            {validationReport.errors.slice(0, 10).map((err, i) => (
                              <p key={i} className="text-[11px] text-rose-400 flex items-start gap-1.5">
                                <FiAlertCircle className="shrink-0 mt-0.5" /> {err}
                              </p>
                            ))}
                            {validationReport.errors.length > 10 && (
                              <p className="text-[11px] text-slate-500">+{validationReport.errors.length - 10} more issues</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Publish Button */}
                  {validationReport?.canPublish && (
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-60"
                    >
                      {publishing ? 'Publishing…' : 'Publish PYQ Paper'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl disabled:opacity-40 transition-all hover:bg-dark-700"
              >
                <FiChevronLeft /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                {currentStep < STEPS.length - 1 && (
                  <button
                    onClick={() => setCurrentStep(s => Math.min(STEPS.length - 1, s + 1))}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Next <FiChevronRight />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
