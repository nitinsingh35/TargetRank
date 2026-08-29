import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiSave, FiSettings, FiSliders, 
  FiCheckCircle, FiAlertCircle, FiPlus, FiTrash2, FiClock 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';
import examAPI from '../../api/examApi.js';

export default function MockTestEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Syllabus caches
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [templates, setTemplates] = useState([]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examId, setExamId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [category, setCategory] = useState('full_length');
  const [instructions, setInstructions] = useState('');
  const [instructionsHindi, setInstructionsHindi] = useState('');
  const [language, setLanguage] = useState('english');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [totalQuestions, setTotalQuestions] = useState(100);
  const [totalMarks, setTotalMarks] = useState(200);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(true);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState(0.33);
  const [passingMarks, setPassingMarks] = useState(40);
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState(0);
  const [questionSelectionMode, setQuestionSelectionMode] = useState('dynamic');
  
  // Dynamic rules
  const [includePYQ, setIncludePYQ] = useState(true);
  const [includeOriginalPractice, setIncludeOriginalPractice] = useState(true);
  const [includeCurrentAffairs, setIncludeCurrentAffairs] = useState(true);
  const [excludeRecentAttemptedDays, setExcludeRecentAttemptedDays] = useState(30);
  const [difficultyDistribution, setDifficultyDistribution] = useState({ easy: 25, medium: 50, hard: 25 });

  // Pattern sections
  const [sections, setSections] = useState([]);
  const [allowSectionNavigation, setAllowSectionNavigation] = useState(true);
  const [allowQuestionNavigation, setAllowQuestionNavigation] = useState(true);
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [tags, setTags] = useState('');

  // Fixed Mode Question IDs
  const [fixedQuestionString, setFixedQuestionString] = useState('');

  // Preview Data
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    setLoading(true);
    try {
      // Load exams list
      const { data: examData } = await examAPI.getExams();
      setExams(examData || []);

      // Load Templates list
      const { data: templateData } = await mockTestAPI.adminGetTemplates();
      setTemplates(templateData.templates || []);

      if (isEditMode) {
        // Load details
        const { data: detailData } = await mockTestAPI.adminGetMockTest(id);
        if (detailData.success && detailData.mockTest) {
          const test = detailData.mockTest;
          setTitle(test.title);
          setDescription(test.description || '');
          setExamId(test.examId?._id || test.examId);
          setCategory(test.category);
          setInstructions(test.instructions || '');
          setInstructionsHindi(test.instructionsHindi || '');
          setLanguage(test.language || 'english');
          setDurationMinutes(test.durationMinutes || 120);
          setTotalQuestions(test.totalQuestions || 100);
          setTotalMarks(test.totalMarks || 200);
          setNegativeMarkingEnabled(test.negativeMarkingEnabled !== false);
          setDefaultNegativeMarks(test.defaultNegativeMarks || 0.33);
          setPassingMarks(test.passingMarks || 40);
          setAttemptLimit(test.attemptLimit || 1);
          setAvailableFrom(test.availableFrom ? test.availableFrom.substring(0, 16) : '');
          setAvailableUntil(test.availableUntil ? test.availableUntil.substring(0, 16) : '');
          setIsPremium(test.isPremium || false);
          setPrice(test.price || 0);
          setQuestionSelectionMode(test.questionSelectionMode || 'dynamic');
          setIncludePYQ(test.selectionRules?.includePYQ !== false);
          setIncludeOriginalPractice(test.selectionRules?.includeOriginalPractice !== false);
          setIncludeCurrentAffairs(test.selectionRules?.includeCurrentAffairs !== false);
          setExcludeRecentAttemptedDays(test.selectionRules?.excludeRecentAttemptedDays || 30);
          setDifficultyDistribution(test.selectionRules?.difficultyDistribution || { easy: 25, medium: 50, hard: 25 });
          
          setSections(test.examPattern?.sections || []);
          setAllowSectionNavigation(test.examPattern?.allowSectionNavigation !== false);
          setAllowQuestionNavigation(test.examPattern?.allowQuestionNavigation !== false);
          setShowQuestionPalette(test.examPattern?.showQuestionPalette !== false);
          setAutoSubmit(test.examPattern?.autoSubmit !== false);
          setTags(test.tags ? test.tags.join(', ') : '');

          if (test.fixedQuestionIds && test.fixedQuestionIds.length > 0) {
            setFixedQuestionString(test.fixedQuestionIds.join(', '));
          }

          // Trigger loading phase & syllabus for the loaded exam
          await handleExamChangeInit(test.examId?._id || test.examId, test.phaseId?._id || test.phaseId);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load mock test configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamChangeInit = async (selectedExam, selectedPhase) => {
    if (!selectedExam) return;
    try {
      const matchExam = exams.find(e => e._id === selectedExam);
      const slug = matchExam?.slug;
      if (slug) {
        const { data: phaseData } = await examAPI.getExamBySlug(slug);
        setPhases(phaseData.phases || []);
      }
      setPhaseId(selectedPhase);

      const { data: syllabusData } = await examAPI.getExamSyllabus(selectedExam);
      if (syllabusData.syllabus) {
        let subjectsList = [];
        let topicsList = [];
        const matchedPhase = syllabusData.syllabus.find(p => p._id === selectedPhase);
        if (matchedPhase && matchedPhase.subjects) {
          matchedPhase.subjects.forEach(sub => {
            subjectsList.push(sub);
            if (sub.topics) {
              sub.topics.forEach(top => topicsList.push(top));
            }
          });
        }
        setAllSubjects(subjectsList);
        setAllTopics(topicsList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExamChange = async (examVal) => {
    setExamId(examVal);
    setPhaseId('');
    setPhases([]);
    setAllSubjects([]);
    setAllTopics([]);
    setSections([]);

    const matchExam = exams.find(e => e._id === examVal);
    if (!matchExam) return;

    try {
      const { data: phaseData } = await examAPI.getExamBySlug(matchExam.slug);
      setPhases(phaseData.phases || []);
      if (phaseData.phases && phaseData.phases.length > 0) {
        const firstPhase = phaseData.phases[0]._id;
        setPhaseId(firstPhase);
        
        // Load syllabus for this phase
        const { data: syllabusData } = await examAPI.getExamSyllabus(examVal);
        if (syllabusData.syllabus) {
          let subjectsList = [];
          let topicsList = [];
          const matchedPhase = syllabusData.syllabus.find(p => p._id === firstPhase);
          if (matchedPhase && matchedPhase.subjects) {
            matchedPhase.subjects.forEach(sub => {
              subjectsList.push(sub);
              if (sub.topics) {
                sub.topics.forEach(top => topicsList.push(top));
              }
            });
          }
          setAllSubjects(subjectsList);
          setAllTopics(topicsList);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load phases.');
    }
  };

  const handlePhaseChange = async (phaseVal) => {
    setPhaseId(phaseVal);
    setAllSubjects([]);
    setAllTopics([]);
    setSections([]);

    if (!examId || !phaseVal) return;

    try {
      const { data: syllabusData } = await examAPI.getExamSyllabus(examId);
      if (syllabusData.syllabus) {
        let subjectsList = [];
        let topicsList = [];
        const matchedPhase = syllabusData.syllabus.find(p => p._id === phaseVal);
        if (matchedPhase && matchedPhase.subjects) {
          matchedPhase.subjects.forEach(sub => {
            subjectsList.push(sub);
            if (sub.topics) {
              sub.topics.forEach(top => topicsList.push(top));
            }
          });
        }
        setAllSubjects(subjectsList);
        setAllTopics(topicsList);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load syllabus subjects.');
    }
  };

  const handleSelectTemplate = (tempId) => {
    const template = templates.find(t => t.id === tempId);
    if (!template) return;

    setDurationMinutes(template.durationMinutes);
    setTotalQuestions(template.totalQuestions);
    setTotalMarks(template.totalMarks);
    setNegativeMarkingEnabled(template.negativeMarkingEnabled);
    setDefaultNegativeMarks(template.defaultNegativeMarks);
    setPassingMarks(template.passingMarks);
    setCategory(template.category || 'full_length');

    // Populate pattern sections
    const prefilledSections = template.sections.map((sec, idx) => ({
      _id: new mongoose.Types.ObjectId().toString(),
      name: sec.name,
      questionCount: sec.questionCount,
      marksPerQuestion: sec.marksPerQuestion,
      negativeMarks: sec.negativeMarks,
      durationMinutes: sec.durationMinutes || 0,
      subjectIds: [],
      topicIds: [],
      order: idx + 1,
    }));
    setSections(prefilledSections);
    toast.success(`Template "${template.name}" properties applied.`);
  };

  // Section managers
  const handleAddSection = () => {
    const newSection = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: `Section ${sections.length + 1}`,
      questionCount: 10,
      marksPerQuestion: 2,
      negativeMarks: 0.66,
      durationMinutes: 0,
      subjectIds: [],
      topicIds: [],
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId) => {
    setSections(sections.filter(s => s._id !== sectionId));
  };

  const handleUpdateSectionField = (sectionId, field, value) => {
    setSections(sections.map(s => {
      if (s._id === sectionId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleToggleSubjectInSection = (sectionId, subId) => {
    setSections(sections.map(s => {
      if (s._id === sectionId) {
        const exists = s.subjectIds.includes(subId);
        const subjectIds = exists 
          ? s.subjectIds.filter(id => id !== subId) 
          : [...s.subjectIds, subId];
        return { ...s, subjectIds };
      }
      return s;
    }));
  };

  const handleToggleTopicInSection = (sectionId, topId) => {
    setSections(sections.map(s => {
      if (s._id === sectionId) {
        const exists = s.topicIds.includes(topId);
        const topicIds = exists 
          ? s.topicIds.filter(id => id !== topId) 
          : [...s.topicIds, topId];
        return { ...s, topicIds };
      }
      return s;
    }));
  };

  const runAvailabilityPreview = async () => {
    if (!isEditMode) {
      toast.error('Please save the mock test as draft before checking real-time availability preview.');
      return;
    }
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const { data } = await mockTestAPI.adminPreviewAvailability(id);
      if (data.success) {
        setPreviewData(data);
      }
    } catch (err) {
      toast.error('Preview error: Please check section fields are set up correctly.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async (shouldPublish = false) => {
    try {
      const payload = {
        title,
        description,
        examId,
        phaseId,
        category,
        instructions,
        instructionsHindi,
        language,
        durationMinutes: Number(durationMinutes),
        totalQuestions: Number(totalQuestions),
        totalMarks: Number(totalMarks),
        negativeMarkingEnabled,
        defaultNegativeMarks: Number(defaultNegativeMarks),
        passingMarks: Number(passingMarks),
        attemptLimit: Number(attemptLimit),
        availableFrom: availableFrom || null,
        availableUntil: availableUntil || null,
        isPremium,
        price: Number(price),
        questionSelectionMode,
        fixedQuestionIds: questionSelectionMode === 'fixed' 
          ? fixedQuestionString.split(',').map(s => s.trim()).filter(Boolean) 
          : [],
        selectionRules: {
          difficultyDistribution,
          includePYQ,
          includeOriginalPractice,
          includeCurrentAffairs,
          excludeRecentAttemptedDays: Number(excludeRecentAttemptedDays),
        },
        examPattern: {
          sections: sections.map(s => ({
            name: s.name,
            questionCount: Number(s.questionCount),
            marksPerQuestion: Number(s.marksPerQuestion),
            negativeMarks: Number(s.negativeMarks),
            durationMinutes: Number(s.durationMinutes) || 0,
            subjectIds: s.subjectIds,
            topicIds: s.topicIds,
            order: Number(s.order) || 0,
          })),
          allowSectionNavigation,
          allowQuestionNavigation,
          showQuestionPalette,
          autoSubmit,
        },
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (isEditMode) {
        await mockTestAPI.adminUpdateMockTest(id, payload);
        toast.success('Mock Test template changes saved.');
      } else {
        const { data } = await mockTestAPI.adminCreateMockTest(payload);
        if (data.success) {
          toast.success('Mock Test draft generated successfully.');
          navigate('/admin/mock-tests');
          return;
        }
      }

      if (shouldPublish) {
        try {
          const { data } = await mockTestAPI.adminPublishMockTest(id, { allowAvailableCountMode: false });
          if (data.success) {
            toast.success('Mock Test template is now active & published!');
            navigate('/admin/mock-tests');
          }
        } catch (err) {
          const res = err.response?.data;
          if (res?.shortage) {
            if (window.confirm(`${res.message}\n\nDo you want to override and publish in Available-Count Mode?`)) {
              const override = await mockTestAPI.adminPublishMockTest(id, { allowAvailableCountMode: true });
              if (override.data.success) {
                toast.success('Published in Available-Count Mode.');
                navigate('/admin/mock-tests');
              }
            }
          } else {
            toast.error(res?.message || 'Publish status update failed.');
          }
        }
      } else {
        navigate('/admin/mock-tests');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save mock test template.');
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back navigation */}
        <div className="flex justify-between items-center">
          <Link to="/admin/mock-tests" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-bold">
            <FiArrowLeft /> Back to Catalog
          </Link>
          <span className="text-[10px] text-slate-500 font-bold uppercase">
            Step {currentStep} of 6
          </span>
        </div>

        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {isEditMode ? 'Modify Mock Test Template' : 'Design Simulated Mock Test'}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Pre-fill parameters from defaults, map syllabus weights, check question counts, and toggle publication.</p>
        </div>

        {/* Steps Bar indicator */}
        <div className="grid grid-cols-6 gap-2 bg-dark-900 border border-slate-850 p-1 rounded-xl">
          {[
            'Basic Details',
            'Exam Pattern',
            'Test Sections',
            'Selection Rules',
            'Count Preview',
            'Confirm Draft'
          ].map((label, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx + 1)}
              className={`py-2 text-[10px] font-black rounded-lg transition-all ${
                currentStep === idx + 1 
                  ? 'bg-brand-500 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {idx + 1}. {label}
            </button>
          ))}
        </div>

        {/* STEP 1: BASIC DETAILS */}
        {currentStep === 1 && (
          <div className="glass-card p-6 bg-dark-900/40 border-slate-850 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Step 1: Test Details</h3>
            
            <div className="space-y-3">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Test Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. UPSC Prelims Full Mock 1" 
                  className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Details for student context..." 
                  rows="3"
                  className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Exam */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Exam Category</label>
                  <select
                    value={examId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Choose Exam...</option>
                    {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                  </select>
                </div>

                {/* Phase */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Exam Phase</label>
                  <select
                    value={phaseId}
                    onChange={(e) => handlePhaseChange(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                    disabled={!examId}
                  >
                    <option value="">Choose Phase...</option>
                    {phases.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                  >
                    <option value="full_length">Full Length</option>
                    <option value="sectional">Sectional</option>
                    <option value="subject_wise">Subject Wise</option>
                    <option value="topic_wise">Topic Wise</option>
                    <option value="pyq_paper">PYQ Paper</option>
                    <option value="current_affairs">Current Affairs</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                  >
                    <option value="english">English Only</option>
                    <option value="hindi">Hindi Only</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </div>

                {/* Selection Mode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Selection Mode</label>
                  <select
                    value={questionSelectionMode}
                    onChange={(e) => setQuestionSelectionMode(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-slate-700"
                  >
                    <option value="dynamic">Dynamic Generator Mode</option>
                    <option value="fixed">Fixed Question Mode</option>
                  </select>
                </div>
              </div>

              {/* Cost / Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="premium-toggle"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="rounded text-brand-500 focus:ring-brand-400 bg-dark-900 border-slate-800 w-4 h-4"
                  />
                  <label htmlFor="premium-toggle" className="text-xs font-bold text-slate-300 cursor-pointer">Mark as Premium Test</label>
                </div>
                {isPremium && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Price (INR)</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(Number(e.target.value))} 
                      className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
                    />
                  </div>
                )}
              </div>

              {/* Time limits / Limit counts */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Duration (Mins)</label>
                  <input 
                    type="number" 
                    value={durationMinutes} 
                    onChange={(e) => setDurationMinutes(Number(e.target.value))} 
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Total Questions</label>
                  <input 
                    type="number" 
                    value={totalQuestions} 
                    onChange={(e) => setTotalQuestions(Number(e.target.value))} 
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Total Marks</label>
                  <input 
                    type="number" 
                    value={totalMarks} 
                    onChange={(e) => setTotalMarks(Number(e.target.value))} 
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Attempt Limit</label>
                  <input 
                    type="number" 
                    value={attemptLimit} 
                    onChange={(e) => setAttemptLimit(Number(e.target.value))} 
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Availability bounds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Available From</label>
                  <input 
                    type="datetime-local" 
                    value={availableFrom} 
                    onChange={(e) => setAvailableFrom(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Available Until</label>
                  <input 
                    type="datetime-local" 
                    value={availableUntil} 
                    onChange={(e) => setAvailableUntil(e.target.value)} 
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT EXAM PATTERN TEMPLATE */}
        {currentStep === 2 && (
          <div className="glass-card p-6 bg-dark-900/40 border-slate-850 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Step 2: Choose Starter Pattern Template</h3>
            
            <div className="space-y-3">
              <p className="text-slate-500 text-xs">Selecting a default template will pre-populate marking values, total question limits, and section distribution layouts. You can fully edit them in the next step.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {templates.map((temp) => (
                  <div 
                    key={temp.id} 
                    className="p-4 bg-dark-950 border border-slate-800 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-brand-400">{temp.examName}</p>
                      <h4 className="text-xs font-bold text-white mt-1">{temp.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Questions: {temp.totalQuestions} · Marks: {temp.totalMarks} · Duration: {temp.durationMinutes}m
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(temp.id)}
                      className="mt-4 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Apply Template
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: EDIT SECTIONS AND MARKS */}
        {currentStep === 3 && (
          <div className="glass-card p-6 bg-dark-900/40 border-slate-850 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Step 3: Define Pattern Sections</h3>
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-slate-850 hover:bg-slate-800 text-brand-400 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
              >
                <FiPlus /> Add Section
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {sections.length === 0 ? (
                <p className="text-slate-500 text-xs italic text-center py-8">No sections defined yet. Select a template in Step 2 or click "Add Section" above.</p>
              ) : (
                sections.map((sec, idx) => (
                  <div key={sec._id} className="p-4 bg-dark-950 border border-slate-800 rounded-xl space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sec._id)}
                      className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 p-1"
                      title="Remove Section"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Section Name */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Section Name</label>
                        <input 
                          type="text" 
                          value={sec.name} 
                          onChange={(e) => handleUpdateSectionField(sec._id, 'name', e.target.value)} 
                          className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>

                      {/* Order */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Display Order</label>
                        <input 
                          type="number" 
                          value={sec.order} 
                          onChange={(e) => handleUpdateSectionField(sec._id, 'order', Number(e.target.value))} 
                          className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {/* Question Count */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Q Count</label>
                        <input 
                          type="number" 
                          value={sec.questionCount} 
                          onChange={(e) => handleUpdateSectionField(sec._id, 'questionCount', Number(e.target.value))} 
                          className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>

                      {/* Marks per Question */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Marks / Q</label>
                        <input 
                          type="number" 
                          value={sec.marksPerQuestion} 
                          onChange={(e) => handleUpdateSectionField(sec._id, 'marksPerQuestion', Number(e.target.value))} 
                          className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>

                      {/* Negative Marks */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Neg Marks / Q</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={sec.negativeMarks} 
                          onChange={(e) => handleUpdateSectionField(sec._id, 'negativeMarks', Number(e.target.value))} 
                          className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>

                      {/* Section duration */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Time limit (min)</label>
                        <input 
                          type="number" 
                          value={sec.durationMinutes} 
                          onChange={(e) => handleUpdateSectionField(sec._id, 'durationMinutes', Number(e.target.value))} 
                          placeholder="0 = none"
                          className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Section Subject / Topic filters mapping */}
                    {questionSelectionMode === 'dynamic' && (
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <div>
                          <label className="text-[9px] font-bold text-slate-550 uppercase">Section Subjects mapping</label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {allSubjects.map(sub => {
                              const selected = sec.subjectIds.includes(sub._id);
                              return (
                                <button
                                  key={sub._id}
                                  type="button"
                                  onClick={() => handleToggleSubjectInSection(sec._id, sub._id)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                                    selected 
                                      ? 'bg-brand-500/20 border-brand-500 text-brand-300' 
                                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                  }`}
                                >
                                  {sub.title}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {sec.subjectIds.length > 0 && (
                          <div className="pt-2">
                            <label className="text-[9px] font-bold text-slate-555 uppercase">Syllabus topics filter (Optional)</label>
                            <div className="flex flex-wrap gap-1.5 mt-1 max-h-24 overflow-y-auto border border-slate-850 p-2 rounded-lg bg-[#030712]/30">
                              {allTopics
                                .filter(t => sec.subjectIds.includes(t.subjectId?._id || t.subjectId))
                                .map(top => {
                                  const selected = sec.topicIds.includes(top._id);
                                  return (
                                    <button
                                      key={top._id}
                                      type="button"
                                      onClick={() => handleToggleTopicInSection(sec._id, top._id)}
                                      className={`px-2 py-0.5 rounded text-[9px] font-semibold border transition-all ${
                                        selected 
                                          ? 'bg-purple-500/20 border-purple-500 text-purple-300' 
                                          : 'bg-dark-900 border-slate-850 text-slate-500 hover:border-slate-800'
                                      }`}
                                    >
                                      {top.title}
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 4: CONFIGURE QUESTION SELECTION RULES */}
        {currentStep === 4 && (
          <div className="glass-card p-6 bg-dark-900/40 border-slate-850 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Step 4: Dynamic Question Selection Rules</h3>
            
            {questionSelectionMode === 'fixed' ? (
              <div className="space-y-3">
                <p className="text-slate-500 text-xs">For Fixed Question Mode, enter a list of comma-separated MongoDB Question ObjectIds that you wish to add explicitly to this Mock Test.</p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fixed Question IDs (comma separated)</label>
                  <textarea 
                    value={fixedQuestionString} 
                    onChange={(e) => setFixedQuestionString(e.target.value)} 
                    placeholder="65e89d..., 65e8a2..." 
                    rows="5"
                    className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Sources filter */}
                  <div className="bg-dark-950 border border-slate-800 p-4 rounded-xl space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Filter Question Sources</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="include-pyq"
                          checked={includePYQ}
                          onChange={(e) => setIncludePYQ(e.target.checked)}
                          className="rounded text-brand-500 focus:ring-brand-400 bg-dark-900 border-slate-800 w-4 h-4"
                        />
                        <label htmlFor="include-pyq" className="text-xs font-semibold text-slate-300 cursor-pointer">Include Previous Year Questions (PYQs)</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="include-original"
                          checked={includeOriginalPractice}
                          onChange={(e) => setIncludeOriginalPractice(e.target.checked)}
                          className="rounded text-brand-500 focus:ring-brand-400 bg-dark-900 border-slate-800 w-4 h-4"
                        />
                        <label htmlFor="include-original" className="text-xs font-semibold text-slate-300 cursor-pointer">Include Original practice questions</label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="include-ca"
                          checked={includeCurrentAffairs}
                          onChange={(e) => setIncludeCurrentAffairs(e.target.checked)}
                          className="rounded text-brand-500 focus:ring-brand-400 bg-dark-900 border-slate-800 w-4 h-4"
                        />
                        <label htmlFor="include-ca" className="text-xs font-semibold text-slate-300 cursor-pointer">Include Current Affairs</label>
                      </div>
                    </div>
                  </div>

                  {/* Recency Prevent parameters */}
                  <div className="bg-dark-950 border border-slate-800 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Non-Repeating limit</p>
                      <p className="text-[10px] text-slate-500 leading-normal">Specify how many days ago attempted questions must be excluded from this mock setup for aspirants.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Exclusion Days</label>
                      <input 
                        type="number" 
                        value={excludeRecentAttemptedDays} 
                        onChange={(e) => setExcludeRecentAttemptedDays(Number(e.target.value))} 
                        className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Difficulty distributions */}
                <div className="bg-dark-950 border border-slate-800 p-4 rounded-xl space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Difficulty distribution ratios (%)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Easy (%)</label>
                      <input 
                        type="number" 
                        value={difficultyDistribution.easy} 
                        onChange={(e) => setDifficultyDistribution({ ...difficultyDistribution, easy: Number(e.target.value) })} 
                        className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Medium (%)</label>
                      <input 
                        type="number" 
                        value={difficultyDistribution.medium} 
                        onChange={(e) => setDifficultyDistribution({ ...difficultyDistribution, medium: Number(e.target.value) })} 
                        className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Hard (%)</label>
                      <input 
                        type="number" 
                        value={difficultyDistribution.hard} 
                        onChange={(e) => setDifficultyDistribution({ ...difficultyDistribution, hard: Number(e.target.value) })} 
                        className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 text-right">
                    Sum: <strong className={
                      (difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard === 100)
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }>
                      {difficultyDistribution.easy + difficultyDistribution.medium + difficultyDistribution.hard}%
                    </strong> (Must sum to 100)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: AVAILABILITY PREVIEW */}
        {currentStep === 5 && (
          <div className="glass-card p-6 bg-dark-900/40 border-slate-850 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Step 5: Question Availability Check</h3>
              <button
                type="button"
                onClick={runAvailabilityPreview}
                className="bg-slate-850 hover:bg-slate-800 text-sky-400 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
              >
                <FiRefreshCw className={previewLoading ? 'animate-spin' : ''} /> Run Check
              </button>
            </div>

            <div className="space-y-4">
              {!isEditMode ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-2">
                  <FiAlertCircle className="text-xl text-amber-400 mx-auto" />
                  <p className="text-xs font-medium text-amber-300">Test has not been created yet.</p>
                  <p className="text-[10px] text-slate-500">Please go to Step 6 and click "Save Draft" first, then return here to run the availability preview checklist.</p>
                </div>
              ) : previewLoading ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-[10px] font-semibold">Running aggregates...</p>
                </div>
              ) : previewData ? (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {previewData.sectionsPreview.map((sec, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 border rounded-xl flex justify-between items-center gap-4 ${
                          sec.isSufficient 
                            ? 'border-emerald-500/10 bg-emerald-500/5' 
                            : 'border-rose-500/10 bg-rose-500/5'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{sec.sectionName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Available in bank: <strong className="text-slate-300">{sec.available}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-300">
                            Required: {sec.required}
                          </p>
                          {sec.shortage > 0 ? (
                            <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                              Shortage: {sec.shortage} Qs
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                              Sufficient
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {previewData.overallShortage > 0 ? (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-400 leading-normal">
                      <FiAlertCircle className="text-base shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Question Shortage Warning</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">There is a combined shortage of <strong className="text-amber-300">{previewData.overallShortage} questions</strong>. You can still save the draft, but publishing will require allowing "Available-Count Mode".</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <FiCheckCircle className="text-base" />
                      <span>Ready to publish! The question bank has a sufficient number of matching questions.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-xs text-center py-8">Click "Run Check" above to scan the question bank.</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: INSTRUCTIONS AND PUBLISH */}
        {currentStep === 6 && (
          <div className="glass-card p-6 bg-dark-900/40 border-slate-850 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Step 6: Instructions & Save settings</h3>
            
            <div className="space-y-4">
              {/* Instructions EN */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions (English)</label>
                <textarea 
                  value={instructions} 
                  onChange={(e) => setInstructions(e.target.value)} 
                  placeholder="Enter test guidelines for candidates..." 
                  rows="3"
                  className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Instructions HI */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Instructions (Hindi)</label>
                <textarea 
                  value={instructionsHindi} 
                  onChange={(e) => setInstructionsHindi(e.target.value)} 
                  placeholder="निर्देश हिंदी में..." 
                  rows="3"
                  className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Search Tags (Comma separated)</label>
                <input 
                  type="text" 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)} 
                  placeholder="prelims, 2026, polity" 
                  className="w-full bg-[#030712] border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Advanced Pattern Navigation flags */}
              <div className="bg-dark-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Attempt Window Configuration</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allow-sec-nav"
                      checked={allowSectionNavigation}
                      onChange={(e) => setAllowSectionNavigation(e.target.checked)}
                      className="rounded bg-dark-900 border-slate-800 w-4 h-4"
                    />
                    <label htmlFor="allow-sec-nav" className="text-xs text-slate-300 font-semibold cursor-pointer">Allow Section Jump</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="allow-q-nav"
                      checked={allowQuestionNavigation}
                      onChange={(e) => setAllowQuestionNavigation(e.target.checked)}
                      className="rounded bg-dark-900 border-slate-800 w-4 h-4"
                    />
                    <label htmlFor="allow-q-nav" className="text-xs text-slate-300 font-semibold cursor-pointer">Allow Question Jumps</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="show-palette"
                      checked={showQuestionPalette}
                      onChange={(e) => setShowQuestionPalette(e.target.checked)}
                      className="rounded bg-dark-900 border-slate-800 w-4 h-4"
                    />
                    <label htmlFor="show-palette" className="text-xs text-slate-300 font-semibold cursor-pointer">Show Question Palette</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto-submit-chk"
                      checked={autoSubmit}
                      onChange={(e) => setAutoSubmit(e.target.checked)}
                      className="rounded bg-dark-900 border-slate-800 w-4 h-4"
                    />
                    <label htmlFor="auto-submit-chk" className="text-xs text-slate-300 font-semibold cursor-pointer">Auto-Submit on timer expiry</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step controls */}
        <div className="flex justify-between items-center gap-4 bg-dark-900/60 p-4 border border-slate-850 rounded-xl">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white disabled:opacity-40"
          >
            Previous Step
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg flex items-center gap-1"
            >
              <FiSave /> Save Draft
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 text-xs font-bold text-brand-950 bg-brand-400 hover:bg-brand-300 rounded-lg"
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1"
              >
                <FiCheckCircle /> Publish Template
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
