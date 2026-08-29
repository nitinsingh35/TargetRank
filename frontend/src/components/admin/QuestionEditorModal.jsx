import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiSave, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';
import questionAPI from '../../api/questionApi.js';

const TYPE_OPTIONS = [
  { value: 'mcq', label: 'Multiple Choice (Single Correct)' },
  { value: 'multiple_select', label: 'Multiple Choice (Multiple Correct)' },
  { value: 'true_false', label: 'True / False' },
  { value: 'assertion_reason', label: 'Assertion - Reason' },
  { value: 'statement_based', label: 'Statement Based' },
  { value: 'match_the_following', label: 'Match the Following' },
  { value: 'passage_based', label: 'Passage Based' },
  { value: 'numerical', label: 'Numerical Answer' },
  { value: 'descriptive', label: 'Descriptive/Written' },
  { value: 'interview', label: 'Interview Question' },
  { value: 'case_study', label: 'Case Study' },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const IMPORTANCE_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'basic', label: 'Basic Core Concept' },
  { value: 'important', label: 'Important' },
  { value: 'very_important', label: 'Very Important' },
  { value: 'high_frequency', label: 'High Frequency PYQ' },
  { value: 'must_do', label: 'Must Do Practice' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'archived', label: 'Archived' },
];

const SOURCE_TYPE_OPTIONS = [
  { value: 'original_practice', label: 'Original Practice' },
  { value: 'previous_year', label: 'Previous Year Question (PYQ)' },
  { value: 'current_affairs', label: 'Current Affairs' },
  { value: 'book_based', label: 'Book Based Concept' },
  { value: 'mentor_created', label: 'Mentor Created' },
  { value: 'official_reference', label: 'Official Reference' },
];

const COPYRIGHT_OPTIONS = [
  { value: 'original', label: 'Original Content (Copyright TargetRank)' },
  { value: 'public_domain', label: 'Public Domain / Free Use' },
  { value: 'licensed', label: 'Licensed / Permission Acquired' },
  { value: 'official_source_link', label: 'Official Source (Linked Only)' },
  { value: 'needs_review', label: 'Needs Review' },
];

export default function QuestionEditorModal({ question, onClose, onSaveSuccess }) {
  const isEdit = !!question;

  // ─── Classification Options Cache ───
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  // ─── Form Fields State ───
  const [form, setForm] = useState({
    examId: '',
    phaseId: '',
    subjectId: '',
    topicId: '',
    subtopicId: '',
    questionType: 'mcq',
    questionText: '',
    questionHindi: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    correctAnswers: [],
    explanation: '',
    explanationHindi: '',
    difficulty: 'medium',
    marks: 2,
    negativeMarks: 0.66,
    language: 'english',
    sourceType: 'original_practice',
    sourceName: '',
    sourceYear: '',
    paperName: '',
    sourceReference: '',
    copyrightStatus: 'original',
    qualityStatus: 'draft',
    isPublished: false,
    estimatedSolveTime: 60,
    importanceLevel: 'normal',
    tags: '',
  });

  const [saving, setSaving] = useState(false);

  // 1. Initial Load of Exams
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
      } catch (err) {
        toast.error('Failed to load exams list');
      }
    };
    loadExams();

    if (isEdit && question) {
      // Map existing values
      setForm({
        examId: question.examId?._id || question.examId || '',
        phaseId: question.phaseId?._id || question.phaseId || '',
        subjectId: question.subjectId?._id || question.subjectId || '',
        topicId: question.topicId?._id || question.topicId || '',
        subtopicId: question.subtopicId?._id || question.subtopicId || '',
        questionType: question.questionType || 'mcq',
        questionText: question.questionText || '',
        questionHindi: question.questionHindi || '',
        options: question.options && question.options.length ? [...question.options] : ['', '', '', ''],
        correctAnswer: question.correctAnswer || '',
        correctAnswers: question.correctAnswers || [],
        explanation: question.explanation || '',
        explanationHindi: question.explanationHindi || '',
        difficulty: question.difficulty || 'medium',
        marks: question.marks !== undefined ? question.marks : 2,
        negativeMarks: question.negativeMarks !== undefined ? question.negativeMarks : 0.66,
        language: question.language || 'english',
        sourceType: question.sourceType || 'original_practice',
        sourceName: question.sourceName || '',
        sourceYear: question.sourceYear || '',
        paperName: question.paperName || '',
        sourceReference: question.sourceReference || '',
        copyrightStatus: question.copyrightStatus || 'original',
        qualityStatus: question.qualityStatus || 'draft',
        isPublished: question.isPublished || false,
        estimatedSolveTime: question.estimatedSolveTime || 60,
        importanceLevel: question.importanceLevel || 'normal',
        tags: question.tags ? question.tags.join(', ') : '',
      });
    }
  }, [question, isEdit]);

  // 2. Cascade Dropdowns: Load Phases when Exam changes
  useEffect(() => {
    if (!form.examId) {
      setPhases([]);
      return;
    }
    const loadPhases = async () => {
      try {
        // Query to get phases for this specific exam
        const { data } = await examAPI.getExamSyllabus(form.examId);
        // Syllabus contains the array of phases
        setPhases(data.syllabus || []);
      } catch (err) {
        toast.error('Failed to load phases for this exam');
      }
    };
    loadPhases();
  }, [form.examId]);

  // 3. Cascade Dropdowns: Populate Subjects when Phase changes
  useEffect(() => {
    if (!form.phaseId || phases.length === 0) {
      setSubjects([]);
      return;
    }
    const selectedPhase = phases.find(p => p._id === form.phaseId);
    setSubjects(selectedPhase?.subjects || []);
  }, [form.phaseId, phases]);

  // 4. Cascade Dropdowns: Populate Topics when Subject changes
  useEffect(() => {
    if (!form.subjectId || subjects.length === 0) {
      setTopics([]);
      return;
    }
    const selectedSubject = subjects.find(s => s._id === form.subjectId);
    setTopics(selectedSubject?.topics || []);
  }, [form.subjectId, subjects]);

  // 5. Cascade Dropdowns: Populate Subtopics when Topic changes
  useEffect(() => {
    if (!form.topicId || topics.length === 0) {
      setSubtopics([]);
      return;
    }
    const selectedTopic = topics.find(t => t._id === form.topicId);
    setSubtopics(selectedTopic?.subtopics || []);
  }, [form.topicId, topics]);

  // ─── Input Handlers ───
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionChange = (idx, value) => {
    setForm(prev => {
      const opts = [...prev.options];
      opts[idx] = value;
      return { ...prev, options: opts };
    });
  };

  const addOption = () => {
    setForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (idx) => {
    setForm(prev => {
      const opts = prev.options.filter((_, i) => i !== idx);
      return { ...prev, options: opts };
    });
  };

  const handleMultiCorrectChange = (opt, isChecked) => {
    setForm(prev => {
      let cur = [...prev.correctAnswers];
      if (isChecked) {
        if (!cur.includes(opt)) cur.push(opt);
      } else {
        cur = cur.filter(x => x !== opt);
      }
      return { ...prev, correctAnswers: cur };
    });
  };

  // ─── Save Action ───
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.examId || !form.phaseId || !form.subjectId || !form.topicId) {
      toast.error('Please fill all classification dropdowns down to Topic level');
      return;
    }
    if (!form.questionText.trim()) {
      toast.error('Question Text is required');
      return;
    }

    // Process tag strings
    const tagArray = form.tags
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const payload = {
      ...form,
      tags: tagArray,
      isPublished: form.qualityStatus === 'published',
      // If PYQ, force source type and previous year question true
      isPreviousYearQuestion: form.sourceType === 'previous_year',
    };

    // Special validation checks depending on type
    if (form.questionType === 'mcq') {
      if (!form.options.includes(form.correctAnswer)) {
        toast.error('Correct Answer must match one of the listed options');
        return;
      }
    }
    if (form.questionType === 'multiple_select') {
      if (form.correctAnswers.length < 2) {
        toast.error('Please select at least 2 correct answers');
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await questionAPI.updateQuestion(question._id, payload);
        toast.success('Question updated successfully!');
      } else {
        await questionAPI.createQuestion(payload);
        toast.success('Question created successfully!');
      }
      onSaveSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-850">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isEdit ? 'Edit Question Details' : 'Create New Question'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">QCMS Editor Panel</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          
          {/* Classification Section */}
          <div className="bg-[#121824] rounded-xl p-4 border border-slate-850 space-y-4">
            <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">1. Exam & Syllabus Classification</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Exam *</label>
                <select name="examId" value={form.examId} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-semibold">
                  <option value="">Select Exam</option>
                  {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Phase *</label>
                <select name="phaseId" value={form.phaseId} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-semibold">
                  <option value="">Select Phase</option>
                  {phases.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Subject *</label>
                <select name="subjectId" value={form.subjectId} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-semibold">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Topic *</label>
                <select name="topicId" value={form.topicId} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-semibold">
                  <option value="">Select Topic</option>
                  {topics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Subtopic</label>
                <select name="subtopicId" value={form.subtopicId} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500 font-semibold">
                  <option value="">Select Subtopic</option>
                  {subtopics.map(st => <option key={st._id} value={st._id}>{st.title}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Question Text Rich Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Question Text (English) *</label>
              <textarea
                name="questionText"
                value={form.questionText}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Enter English question content (HTML/Rich-text tags supported)..."
                className="w-full bg-dark-900 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Question Text (Hindi)</label>
              <textarea
                name="questionHindi"
                value={form.questionHindi}
                onChange={handleChange}
                rows={4}
                placeholder="हिंदी प्रश्न दर्ज करें (वैकल्पिक)..."
                className="w-full bg-dark-900 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Options Configuration */}
          {['mcq', 'multiple_select', 'true_false', 'match_the_following', 'assertion_reason', 'statement_based'].includes(form.questionType) && (
            <div className="bg-[#121824]/40 border border-slate-850 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Question Options Configuration</h4>
                {form.questionType !== 'true_false' && (
                  <button type="button" onClick={addOption} className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 font-bold">
                    <FiPlus /> Add Option
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold font-mono">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Enter text for Option ${String.fromCharCode(65 + idx)}...`}
                      required
                      className="flex-1 bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                    />
                    
                    {/* For Multiple Select: show Checkbox */}
                    {form.questionType === 'multiple_select' && (
                      <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={form.correctAnswers.includes(opt)}
                          onChange={(e) => handleMultiCorrectChange(opt, e.target.checked)}
                          className="w-4.5 h-4.5 bg-dark-900 border border-slate-800 rounded checked:bg-brand-500"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">Correct</span>
                      </label>
                    )}

                    {/* Trash Action */}
                    {form.options.length > 2 && form.questionType !== 'true_false' && (
                      <button type="button" onClick={() => removeOption(idx)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* MCQ Single Correct Answer Selection */}
              {form.questionType !== 'multiple_select' && (
                <div className="pt-2">
                  <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Correct Option *</label>
                  <select
                    name="correctAnswer"
                    value={form.correctAnswer}
                    onChange={handleChange}
                    required
                    className="bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Choose Correct Answer</option>
                    {form.options.map((o, idx) => (
                      <option key={idx} value={o}>
                        Option {String.fromCharCode(65 + idx)}: {o.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Difficulty, Status, Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Question Type</label>
              <select name="questionType" value={form.questionType} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
                {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Difficulty Level</label>
              <select name="difficulty" value={form.difficulty} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
                {DIFFICULTY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Importance Priority</label>
              <select name="importanceLevel" value={form.importanceLevel} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
                {IMPORTANCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Quality Status</label>
              <select name="qualityStatus" value={form.qualityStatus} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Marks Assigned</label>
              <input type="number" step="0.5" name="marks" value={form.marks} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Negative Marks</label>
              <input type="number" step="0.01" name="negativeMarks" value={form.negativeMarks} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Est. Solve Time (Seconds)</label>
              <input type="number" name="estimatedSolveTime" value={form.estimatedSolveTime} onChange={handleChange} required className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
            </div>
          </div>

          {/* Explanations Section */}
          <div className="space-y-4 border-t border-slate-900 pt-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. Answers & Explanations</h4>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Explanation (English)</label>
              <textarea
                name="explanation"
                value={form.explanation}
                onChange={handleChange}
                rows={3}
                placeholder="Enter detailed English explanation step by step..."
                className="w-full bg-dark-900 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">Explanation (Hindi)</label>
              <textarea
                name="explanationHindi"
                value={form.explanationHindi}
                onChange={handleChange}
                rows={3}
                placeholder="विस्तृत हिंदी व्याख्या दर्ज करें..."
                className="w-full bg-dark-900 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Source and Copyright Section */}
          <div className="bg-[#121824] rounded-xl p-4 border border-slate-850 space-y-4">
            <h4 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">4. Question Source & Reference Info</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Source Type</label>
                <select name="sourceType" value={form.sourceType} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
                  {SOURCE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Source Name / Organiser</label>
                <input type="text" name="sourceName" value={form.sourceName} onChange={handleChange} placeholder="e.g. UPSC Prelims, NCERT" className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Source Year</label>
                <input type="number" name="sourceYear" value={form.sourceYear} onChange={handleChange} placeholder="e.g. 2024" className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Copyright Status</label>
                <select name="copyrightStatus" value={form.copyrightStatus} onChange={handleChange} className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500">
                  {COPYRIGHT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Paper / Chapter Name</label>
                <input type="text" name="paperName" value={form.paperName} onChange={handleChange} placeholder="e.g. Paper I GS, Chapter 3 Polity" className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Reference / Link URL</label>
                <input type="text" name="sourceReference" value={form.sourceReference} onChange={handleChange} placeholder="e.g. Page 54, www.upsc.gov.in" className="w-full bg-dark-900 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 focus:outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Meta Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="e.g. ancient_india, indus_valley, geography, budget2026"
              className="w-full bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Form Actions Footer */}
          <div className="border-t border-slate-850 pt-4 flex justify-end gap-3 sticky bottom-0 bg-[#0b0f19] py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-dark-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold transition-all"
            >
              <FiSave /> {saving ? 'Saving Changes...' : 'Save Question'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
