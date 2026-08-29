import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiChevronLeft, FiChevronRight, FiCheckCircle, FiAlertCircle,
  FiPlus, FiX, FiSearch, FiGlobe, FiCalendar, FiBookOpen, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';
import examAPI from '../../api/examApi.js';
import API from '../../api/api.js';
import AdminSidebar from './AdminSidebar.jsx';

const STEPS = ['Basic Details', 'Categories', 'Link Sources', 'Link Questions', 'Practice Settings', 'Validation & Publish'];

const CATEGORIES = [
  { id: 'national', label: 'National' },
  { id: 'international', label: 'International' },
  { id: 'economy', label: 'Economy' },
  { id: 'environment', label: 'Environment' },
  { id: 'science_technology', label: 'Science & Technology' },
  { id: 'government_schemes', label: 'Government Schemes' },
  { id: 'awards', label: 'Awards' },
  { id: 'sports', label: 'Sports' },
  { id: 'reports_indexes', label: 'Reports & Indexes' },
  { id: 'state_special', label: 'State Special' },
  { id: 'art_culture', label: 'Art & Culture' },
  { id: 'defence', label: 'Defence' },
  { id: 'important_days', label: 'Important Days' },
  { id: 'judiciary', label: 'Judiciary' },
  { id: 'social_issues', label: 'Social Issues' },
  { id: 'miscellaneous', label: 'Miscellaneous' }
];

export default function CurrentAffairsPackEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Schema dropdowns
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);

  // Source Search & Question Search
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourcesFound, setSourcesFound] = useState([]);
  const [searchingSources, setSearchingSources] = useState(false);

  const [questionSearch, setQuestionSearch] = useState('');
  const [questionsFound, setQuestionsFound] = useState([]);
  const [searchingQuestions, setSearchingQuestions] = useState(false);

  // Validation report state
  const [validationReport, setValidationReport] = useState(null);
  const [validating, setValidating] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    language: 'english',
    examIds: [],
    phaseIds: [],
    categories: [],
    sourceIds: [],
    questionIds: [],
    estimatedPracticeMinutes: 30,
    difficultyMix: 'mixed',
    instructions: '',
    instructionsHindi: ''
  });

  useEffect(() => {
    loadExams();
    if (isEditing) {
      loadPack();
    }
  }, [id]);

  useEffect(() => {
    if (form.examIds.length > 0) {
      // Load phases for the first selected exam
      const selected = exams.find(e => e._id === form.examIds[0]);
      setPhases(selected?.phases || []);
    } else {
      setPhases([]);
    }
  }, [form.examIds, exams]);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPack = async () => {
    setLoading(true);
    try {
      const { data } = await currentAffairsAPI.adminGetPack(id);
      setForm({
        title: data.title || '',
        description: data.description || '',
        month: data.month || new Date().getMonth() + 1,
        year: data.year || new Date().getFullYear(),
        language: data.language || 'english',
        examIds: (data.examIds || []).map(e => e._id || e),
        phaseIds: (data.phaseIds || []).map(p => p._id || p),
        categories: data.categories || [],
        sourceIds: data.sourceIds || [],
        questionIds: data.questionIds || [],
        estimatedPracticeMinutes: data.estimatedPracticeMinutes || 30,
        difficultyMix: data.difficultyMix || 'mixed',
        instructions: data.instructions || '',
        instructionsHindi: data.instructionsHindi || ''
      });
    } catch (err) {
      toast.error('Failed to load pack details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleToggleExam = (examId) => {
    setForm(prev => {
      const current = prev.examIds.includes(examId)
        ? prev.examIds.filter(id => id !== examId)
        : [...prev.examIds, examId];
      return { ...prev, examIds: current };
    });
  };

  const handleTogglePhase = (phaseId) => {
    setForm(prev => {
      const current = prev.phaseIds.includes(phaseId)
        ? prev.phaseIds.filter(id => id !== phaseId)
        : [...prev.phaseIds, phaseId];
      return { ...prev, phaseIds: current };
    });
  };

  const handleToggleCategory = (catId) => {
    setForm(prev => {
      const current = prev.categories.includes(catId)
        ? prev.categories.filter(c => c !== catId)
        : [...prev.categories, catId];
      return { ...prev, categories: current };
    });
  };

  // Search Sources
  const handleSearchSources = async () => {
    setSearchingSources(true);
    try {
      const params = {
        status: 'approved',
        month: form.month,
        year: form.year
      };
      if (sourceSearch.trim()) params.search = sourceSearch.trim();

      const { data } = await currentAffairsAPI.adminGetSources(params);
      const linkedSet = new Set(form.sourceIds.map(s => (s._id || s).toString()));
      setSourcesFound((data || []).filter(s => !linkedSet.has(s._id.toString())));
    } catch (err) {
      toast.error('Source search failed.');
    } finally {
      setSearchingSources(false);
    }
  };

  const handleAddSource = (src) => {
    setForm(prev => ({
      ...prev,
      sourceIds: [...prev.sourceIds, src]
    }));
    setSourcesFound(prev => prev.filter(s => s._id !== src._id));
  };

  const handleRemoveSource = (srcId) => {
    setForm(prev => ({
      ...prev,
      sourceIds: prev.sourceIds.filter(s => (s._id || s).toString() !== srcId.toString())
    }));
  };

  // Search Questions
  const handleSearchQuestions = async () => {
    setSearchingQuestions(true);
    try {
      const params = {
        sourceType: 'current_affairs',
        qualityStatus: 'approved',
        currentAffairsMonth: form.month,
        currentAffairsYear: form.year,
        limit: 40
      };
      if (questionSearch.trim()) params.search = questionSearch.trim();

      const { data } = await API.get('/questions', { params });
      const linkedSet = new Set(form.questionIds.map(q => (q._id || q).toString()));
      setQuestionsFound((data.questions || []).filter(q => !linkedSet.has(q._id.toString())));
    } catch (err) {
      toast.error('Question search failed.');
    } finally {
      setSearchingQuestions(false);
    }
  };

  const handleAddQuestion = (q) => {
    setForm(prev => ({
      ...prev,
      questionIds: [...prev.questionIds, q]
    }));
    setQuestionsFound(prev => prev.filter(item => item._id !== q._id));
  };

  const handleRemoveQuestion = (qId) => {
    setForm(prev => ({
      ...prev,
      questionIds: prev.questionIds.filter(q => (q._id || q).toString() !== qId.toString())
    }));
  };

  // Save Pack Draft
  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      toast.error('Pack Title is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        sourceIds: form.sourceIds.map(s => s._id || s),
        questionIds: form.questionIds.map(q => q._id || q)
      };

      if (isEditing) {
        await currentAffairsAPI.adminUpdatePack(id, payload);
        toast.success('Draft saved successfully!');
      } else {
        const { data } = await currentAffairsAPI.adminCreatePack(payload);
        toast.success('Draft pack created!');
        navigate(`/admin/current-affairs/packs/${data.pack._id}/edit`);
        return;
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  // Run Validation
  const handleValidate = async () => {
    if (!id) {
      toast.error('Save pack as a draft first.');
      return;
    }
    setValidating(true);
    try {
      const { data } = await currentAffairsAPI.adminValidatePack(id);
      setValidationReport(data);
    } catch (err) {
      toast.error('Validation failed.');
    } finally {
      setValidating(false);
    }
  };

  // Publish Pack
  const handlePublish = async () => {
    if (!id) return;
    if (!validationReport?.canPublish) {
      toast.error('Pack must pass validation before publishing.');
      return;
    }
    setPublishing(true);
    try {
      await currentAffairsAPI.adminPublishPack(id);
      toast.success('Pack published successfully!');
      navigate('/admin/current-affairs');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBookOpen className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                {isEditing ? 'Edit Pack' : 'Create Pack'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {isEditing ? 'Monthly Pack Editor' : 'Create Monthly Pack'}
            </h1>
          </div>
          <Link
            to="/admin/current-affairs"
            className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            <FiChevronLeft /> Back
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar active="Current Affairs" />

          {/* Form Content */}
          <div className="flex-1 space-y-5">

            {/* Steps indicator */}
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

            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">

              {/* STEP 1: Basic Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Basic details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Pack Title *</label>
                      <input
                        value={form.title}
                        onChange={e => handleChange('title', e.target.value)}
                        placeholder="e.g. UPSC CSE Current Affairs — January 2026"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => handleChange('description', e.target.value)}
                        rows={3}
                        placeholder="Brief summary of what this current affairs pack covers…"
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Month *</label>
                      <select
                        value={form.month}
                        onChange={e => handleChange('month', Number(e.target.value))}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
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
                      />
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

                  {/* Exam Applicability */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400">Target Exams *</label>
                    <div className="flex flex-wrap gap-2">
                      {exams.map(e => {
                        const active = form.examIds.includes(e._id);
                        return (
                          <button
                            key={e._id}
                            type="button"
                            onClick={() => handleToggleExam(e._id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              active ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-dark-800 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {e.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage/Phase applicability */}
                  {phases.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-400">Target Phases</label>
                      <div className="flex flex-wrap gap-2">
                        {phases.map(p => {
                          const active = form.phaseIds.includes(p._id);
                          return (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => handleTogglePhase(p._id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                active ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-dark-800 border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {p.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Categories */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Select Topic Categories *</h2>
                  <p className="text-xs text-slate-500">Pick the sectors/fields of current affairs loaded inside this pack.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {CATEGORIES.map(c => {
                      const active = form.categories.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleToggleCategory(c.id)}
                          className={`p-3 rounded-2xl text-xs font-semibold border flex items-center justify-between transition-all ${
                            active ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-dark-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>{c.label}</span>
                          {active && <FiCheckCircle className="text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Link Sources */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Link Verified Sources</h2>
                  <p className="text-xs text-slate-500">Attach officially approved summaries/articles applicable to this pack.</p>

                  <div className="flex gap-2">
                    <input
                      value={sourceSearch}
                      onChange={e => setSourceSearch(e.target.value)}
                      placeholder="Search verified summaries…"
                      className="flex-1 bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={handleSearchSources}
                      disabled={searchingSources}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      {searchingSources ? 'Search…' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {sourcesFound.length > 0 && (
                    <div className="bg-dark-850 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-48 overflow-y-auto">
                      {sourcesFound.map(s => (
                        <div key={s._id} className="p-3 flex items-center justify-between gap-3 hover:bg-dark-800 transition-colors">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{s.title}</p>
                            <p className="text-[10px] text-slate-500">{s.publisherName} • {s.reliabilityLevel} reliability</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddSource(s)}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 text-[10px] font-bold rounded-lg transition-all"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Linked Sources */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Sources ({form.sourceIds.length})</h3>
                    {form.sourceIds.length === 0 ? (
                      <p className="text-xs text-slate-600">No sources linked yet. Search and link above.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {form.sourceIds.map(src => {
                          const sObj = src._id ? src : { _id: src, title: `Source ID: ${src}` };
                          return (
                            <div key={sObj._id} className="p-2.5 bg-dark-800 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                              <p className="text-xs text-slate-300 truncate">{sObj.title}</p>
                              <button
                                type="button"
                                onClick={() => handleRemoveSource(sObj._id)}
                                className="text-rose-500 hover:text-rose-400"
                              >
                                <FiX />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Link Questions */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Link Questions</h2>
                  <p className="text-xs text-slate-500">Pick from approved current-affairs question bank matching this month/year.</p>

                  <div className="flex gap-2">
                    <input
                      value={questionSearch}
                      onChange={e => setQuestionSearch(e.target.value)}
                      placeholder="Search question bank…"
                      className="flex-1 bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={handleSearchQuestions}
                      disabled={searchingQuestions}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      {searchingQuestions ? 'Search…' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {questionsFound.length > 0 && (
                    <div className="bg-dark-850 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-48 overflow-y-auto">
                      {questionsFound.map(q => (
                        <div key={q._id} className="p-3 flex items-start justify-between gap-3 hover:bg-dark-800 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 line-clamp-2">{q.questionText}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{q.currentAffairsCategory} • {q.marks}M</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddQuestion(q)}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 text-[10px] font-bold rounded-lg transition-all"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Linked Questions */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Linked Questions ({form.questionIds.length})</h3>
                    {form.questionIds.length === 0 ? (
                      <p className="text-xs text-slate-600">No questions linked yet. Search and link above.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-60 overflow-y-auto">
                        {form.questionIds.map((q, idx) => {
                          const qObj = q.questionText ? q : { _id: q, questionText: `Question ID: ${q}` };
                          return (
                            <div key={qObj._id} className="p-2.5 bg-dark-800 border border-slate-800 rounded-xl flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 w-5 text-right">{idx + 1}.</span>
                              <p className="text-xs text-slate-300 truncate flex-1">{qObj.questionText}</p>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(qObj._id)}
                                className="text-rose-500 hover:text-rose-400"
                              >
                                <FiX />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5: Practice Settings */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white">Practice Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Practice Minutes</label>
                      <input
                        type="number"
                        value={form.estimatedPracticeMinutes}
                        onChange={e => handleChange('estimatedPracticeMinutes', Number(e.target.value))}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                        min={5}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Difficulty Mix</label>
                      <select
                        value={form.difficultyMix}
                        onChange={e => handleChange('difficultyMix', e.target.value)}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Practice Instructions (English)</label>
                      <textarea
                        value={form.instructions}
                        onChange={e => handleChange('instructions', e.target.value)}
                        rows={3}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Practice Instructions (Hindi)</label>
                      <textarea
                        value={form.instructionsHindi}
                        onChange={e => handleChange('instructionsHindi', e.target.value)}
                        rows={3}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Validation & Publish */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-white">Validation & Publication check</h2>

                  <div className="bg-dark-800 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Validation Report</h3>
                      <button
                        type="button"
                        onClick={handleValidate}
                        disabled={validating || !id}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded-lg transition-all"
                      >
                        {validating ? 'Running…' : 'Run Validation'}
                      </button>
                    </div>

                    {!validationReport && (
                      <p className="text-xs text-slate-500">Run the validator to inspect linked current affairs questions.</p>
                    )}

                    {validationReport && (
                      <div className="space-y-3">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${validationReport.canPublish ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                          {validationReport.canPublish
                            ? <FiCheckCircle className="text-emerald-400" />
                            : <FiAlertCircle className="text-rose-400" />}
                          <span className={`text-sm font-semibold ${validationReport.canPublish ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {validationReport.canPublish ? 'Ready to Publish' : 'Validation Issues Found'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            ['Total Linked', validationReport.totalLinkedQuestions, 'text-slate-300'],
                            ['Valid', validationReport.validQuestions, 'text-emerald-400'],
                            ['Unverified Q', validationReport.unverifiedQuestions, 'text-amber-400'],
                            ['Unverified Source', validationReport.unverifiedSources, 'text-rose-400']
                          ].map(([label, val, color]) => (
                            <div key={label} className="bg-dark-900 rounded-lg p-2.5 text-center">
                              <p className={`text-lg font-black ${color}`}>{val}</p>
                              <p className="text-[10px] text-slate-500">{label}</p>
                            </div>
                          ))}
                        </div>

                        {validationReport.errors?.length > 0 && (
                          <div className="bg-dark-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                            {validationReport.errors.map((err, i) => (
                              <p key={i} className="text-[11px] text-rose-400 flex items-start gap-1.5">
                                <FiAlertCircle className="shrink-0 mt-0.5" /> {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {validationReport?.canPublish && (
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                    >
                      {publishing ? 'Publishing…' : 'Publish Current Affairs Pack'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Row */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl disabled:opacity-40"
              >
                <FiChevronLeft /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                {currentStep < STEPS.length - 1 && (
                  <button
                    type="button"
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
