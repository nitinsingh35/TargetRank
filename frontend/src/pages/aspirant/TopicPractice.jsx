import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiSliders, FiPlay, FiBookOpen, FiClock,
  FiFilter, FiRotateCcw, FiAlertCircle, FiCheck, FiInfo, FiLayers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import practiceAPI from '../../api/practiceApi.js';
import examAPI from '../../api/examApi.js';

const QUESTION_TYPES = [
  { id: 'all', label: 'All Question Types' },
  { id: 'mcq', label: 'Multiple Choice (MCQ)' },
  { id: 'multiple_select', label: 'Multiple Select (MSQ)' },
  { id: 'descriptive', label: 'Mains Descriptive / Written' },
  { id: 'true_false', label: 'True / False' },
  { id: 'fill_in_blanks', label: 'Fill in the Blanks' },
  { id: 'matching', label: 'Matching List' },
  { id: 'assertion_reason', label: 'Assertion & Reasoning' },
  { id: 'interview', label: 'Interview Preparation Context' },
];

const DIFFICULTY_OPTIONS = [
  { id: 'mixed', label: 'Mixed Difficulty' },
  { id: 'easy', label: 'Easy (Conceptual Checks)' },
  { id: 'medium', label: 'Medium (Standard Exam-Level)' },
  { id: 'hard', label: 'Hard (High-Level Analytical)' },
];

const LANGUAGE_OPTIONS = [
  { id: 'english', label: 'English Only' },
  { id: 'hindi', label: 'Hindi Only' },
  { id: 'bilingual', label: 'Bilingual (English + Hindi)' },
];

const SOURCE_OPTIONS = [
  { id: 'all', label: 'All Questions' },
  { id: 'important', label: 'Important Questions Only' },
  { id: 'previous_year', label: 'Previous Year Questions (PYQs)' },
  { id: 'current_affairs', label: 'Current Affairs Practice' },
  { id: 'book_based', label: 'Book-based Concept Practice' },
  { id: 'weak_topics', label: 'Weak Topics (Incorrect notebook)' },
  { id: 'bookmarked', label: 'Bookmarked Questions' },
  { id: 'mistake_notebook', label: 'Mistake Notebook Questions' },
];

const TIME_PRESETS = [
  { id: '15', label: '15 Minutes' },
  { id: '30', label: '30 Minutes' },
  { id: '45', label: '45 Minutes' },
  { id: '60', label: '60 Minutes' },
  { id: 'custom', label: 'Custom Time' },
];

const MONTHS = [
  { id: 1, label: 'January' }, { id: 2, label: 'February' }, { id: 3, label: 'March' },
  { id: 4, label: 'April' }, { id: 5, label: 'May' }, { id: 6, label: 'June' },
  { id: 7, label: 'July' }, { id: 8, label: 'August' }, { id: 9, label: 'September' },
  { id: 10, label: 'October' }, { id: 11, label: 'November' }, { id: 12, label: 'December' }
];

export default function TopicPractice() {
  const navigate = useNavigate();

  // Lists
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  // Selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [questionType, setQuestionType] = useState('all');
  const [difficulty, setDifficulty] = useState('mixed');
  const [language, setLanguage] = useState('english');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  // Current Affairs Month/Year
  const [selectedCAMonth, setSelectedCAMonth] = useState('');
  const [selectedCAYear, setSelectedCAYear] = useState('2026');

  // Time & Counts
  const [timePreset, setTimePreset] = useState('30');
  const [customTime, setCustomTime] = useState('');
  const [questionCountMode, setQuestionCountMode] = useState('auto');
  const [customQuestionCount, setCustomQuestionCount] = useState('');

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [counting, setCounting] = useState(false);

  // 1. Initial Load: Fetch Exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0]._id);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exams:', err);
        toast.error('Failed to load exams list.');
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  // 2. Load Phases & Syllabus tree when exam changes
  useEffect(() => {
    if (!selectedExamId) {
      setPhases([]);
      setSelectedPhaseId('');
      setSubjects([]);
      setSelectedSubjectId('');
      setTopics([]);
      setSelectedTopicId('');
      return;
    }

    const loadExamData = async () => {
      try {
        const examObj = exams.find(e => e._id === selectedExamId);
        if (!examObj) return;

        // Fetch syllabus tree
        const { data } = await examAPI.getExamSyllabus(selectedExamId);
        if (data.syllabus && data.syllabus.length > 0) {
          setPhases(data.syllabus);
          // Set first phase
          const defaultPhase = data.syllabus[0];
          setSelectedPhaseId(defaultPhase._id);
          
          if (defaultPhase.subjects && defaultPhase.subjects.length > 0) {
            setSubjects(defaultPhase.subjects);
            const defaultSubject = defaultPhase.subjects[0];
            setSelectedSubjectId(defaultSubject._id);
            
            if (defaultSubject.topics && defaultSubject.topics.length > 0) {
              setTopics(defaultSubject.topics);
              setSelectedTopicId(defaultSubject.topics[0]._id);
            } else {
              setTopics([]);
              setSelectedTopicId('');
            }
          } else {
            setSubjects([]);
            setSelectedSubjectId('');
            setTopics([]);
            setSelectedTopicId('');
          }
        }
      } catch (err) {
        console.error('Error loading syllabus:', err);
      }
    };

    loadExamData();
  }, [selectedExamId, exams]);

  // 3. Update subjects/topics when phase changes
  const handlePhaseChange = (phaseId) => {
    setSelectedPhaseId(phaseId);
    const phaseObj = phases.find(p => p._id === phaseId);
    if (phaseObj && phaseObj.subjects && phaseObj.subjects.length > 0) {
      setSubjects(phaseObj.subjects);
      const defaultSub = phaseObj.subjects[0];
      setSelectedSubjectId(defaultSub._id);
      if (defaultSub.topics && defaultSub.topics.length > 0) {
        setTopics(defaultSub.topics);
        setSelectedTopicId(defaultSub.topics[0]._id);
      } else {
        setTopics([]);
        setSelectedTopicId('');
      }
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
      setTopics([]);
      setSelectedTopicId('');
    }
  };

  // 4. Update topics when subject changes
  const handleSubjectChange = (subId) => {
    setSelectedSubjectId(subId);
    const subObj = subjects.find(s => s._id === subId);
    if (subObj && subObj.topics && subObj.topics.length > 0) {
      setTopics(subObj.topics);
      setSelectedTopicId(subObj.topics[0]._id);
    } else {
      setTopics([]);
      setSelectedTopicId('');
    }
  };

  // 5. Load subtopics when topic changes
  useEffect(() => {
    if (!selectedTopicId) {
      setSubtopics([]);
      setSelectedSubtopicId('');
      return;
    }

    const loadSubtopics = async () => {
      try {
        const { data } = await examAPI.getSubtopicsOfTopic(selectedTopicId);
        setSubtopics(data || []);
        setSelectedSubtopicId('');
      } catch (err) {
        console.error('Error fetching subtopics:', err);
      }
    };
    loadSubtopics();
  }, [selectedTopicId]);

  // 6. Query available question count in real time
  useEffect(() => {
    if (!selectedExamId || !selectedPhaseId || !selectedSubjectId || !selectedTopicId) {
      setAvailableCount(0);
      return;
    }

    const getCount = async () => {
      setCounting(true);
      try {
        const params = {
          examId: selectedExamId,
          phaseId: selectedPhaseId,
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          subtopicId: selectedSubtopicId || undefined,
          questionType: questionType !== 'all' ? questionType : undefined,
          difficulty: difficulty,
          language: language,
          sourceFilter: sourceFilter,
          currentAffairsMonth: sourceFilter === 'current_affairs' && selectedCAMonth ? selectedCAMonth : undefined,
          currentAffairsYear: sourceFilter === 'current_affairs' && selectedCAYear ? selectedCAYear : undefined,
        };

        const { data } = await practiceAPI.getAvailableQuestionCount(params);
        setAvailableCount(data.availableQuestionCount || data.total || 0);
      } catch (err) {
        console.error('Error fetching available count:', err);
        setAvailableCount(0);
      } finally {
        setCounting(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      getCount();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [
    selectedExamId, selectedPhaseId, selectedSubjectId, selectedTopicId, selectedSubtopicId,
    questionType, difficulty, language, sourceFilter, selectedCAMonth, selectedCAYear
  ]);

  // Submit Handler
  const handleStartPractice = async () => {
    if (availableCount === 0) {
      toast.error('Cannot start session: No matching questions found.');
      return;
    }

    setSubmitting(true);
    try {
      const finalDuration = timePreset === 'custom' ? Number(customTime) : Number(timePreset);
      if (!finalDuration || finalDuration < 5 || finalDuration > 300) {
        toast.error('Please enter a duration between 5 and 300 minutes.');
        setSubmitting(false);
        return;
      }

      const finalCount = questionCountMode === 'custom' ? Number(customQuestionCount) : null;
      if (questionCountMode === 'custom' && (!finalCount || finalCount < 1)) {
        toast.error('Please enter a valid question count.');
        setSubmitting(false);
        return;
      }

      const postBody = {
        examId: selectedExamId,
        phaseId: selectedPhaseId,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId,
        subtopicId: selectedSubtopicId || undefined,
        mode: 'smart_mixed',
        durationMinutes: finalDuration,
        questionCount: finalCount,
        difficultyPreference: difficulty,
        language: language,
        sourceFilter: sourceFilter,
        questionType: questionType,
        currentAffairsMonth: sourceFilter === 'current_affairs' && selectedCAMonth ? Number(selectedCAMonth) : null,
        currentAffairsYear: sourceFilter === 'current_affairs' && selectedCAYear ? Number(selectedCAYear) : null,
        allowRepeats: true,
      };

      const { data } = await practiceAPI.createSmartSession(postBody);
      if (data.session) {
        toast.success('Practice Session initialized successfully!');
        navigate(`/aspirant/practice-session/${data.session._id}`);
      }
    } catch (err) {
      console.error('Error starting session:', err);
      toast.error(err.response?.data?.message || 'Failed to start practice session.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading syllabus practice configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link to="/aspirant/dashboard" className="inline-flex items-center text-slate-400 hover:text-emerald-400 transition-colors mb-6 text-sm">
          <FiArrowLeft className="mr-2" /> Back to Student Dashboard
        </Link>

        {/* Hero Header */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 to-slate-900 border border-slate-800 p-8 mb-8 shadow-xl">
          <div className="relative z-10">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wide">
              Real Questions Practice
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-3">
              Topic-Wise Syllabus Master Practice
            </h1>
            <p className="mt-2 text-slate-300 max-w-2xl text-sm leading-relaxed">
              Target your syllabus weaknesses directly. Filter down to any specific topic or subtopic, set your practice timing, and get instant verified practice sets.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 blur-[80px] pointer-events-none"></div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Selectors Panel (Left Column) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#0C121D]/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center border-b border-slate-800 pb-3">
                <FiSliders className="text-emerald-500 mr-2" /> 1. Syllabus Filter Scope
              </h2>

              {/* Exam Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Target Exam</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors"
                >
                  <option value="" disabled>Select target exam</option>
                  {exams.map(ex => (
                    <option key={ex._id} value={ex._id}>{ex.title}</option>
                  ))}
                </select>
              </div>

              {/* Phase Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Exam Stage / Phase</label>
                <select
                  value={selectedPhaseId}
                  onChange={(e) => handlePhaseChange(e.target.value)}
                  disabled={phases.length === 0}
                  className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors disabled:opacity-50"
                >
                  <option value="" disabled>Select exam stage</option>
                  {phases.map(ph => (
                    <option key={ph._id} value={ph._id}>{ph.title}</option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={subjects.length === 0}
                  className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors disabled:opacity-50"
                >
                  <option value="" disabled>Select subject</option>
                  {subjects.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.title}</option>
                  ))}
                </select>
              </div>

              {/* Topic Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Topic</label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  disabled={topics.length === 0}
                  className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors disabled:opacity-50"
                >
                  <option value="" disabled>Select topic</option>
                  {topics.map(top => (
                    <option key={top._id} value={top._id}>{top.title}</option>
                  ))}
                </select>
              </div>

              {/* Subtopic Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Subtopic (Optional)</label>
                <span className="text-[10px] text-slate-500 block mb-2">Refine practice target to a nested subtopic if available</span>
                <select
                  value={selectedSubtopicId}
                  onChange={(e) => setSelectedSubtopicId(e.target.value)}
                  disabled={subtopics.length === 0}
                  className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors disabled:opacity-50"
                >
                  <option value="">-- Practice all subtopics in this topic --</option>
                  {subtopics.map(st => (
                    <option key={st._id} value={st._id}>{st.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Rules Panel */}
            <div className="bg-[#0C121D]/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center border-b border-slate-800 pb-3">
                <FiFilter className="text-emerald-500 mr-2" /> 2. Question Customization Rules
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Question Type */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors"
                  >
                    {QUESTION_TYPES.map(qt => (
                      <option key={qt.id} value={qt.id}>{qt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Difficulty Preference</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors"
                  >
                    {DIFFICULTY_OPTIONS.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Language Preference</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors"
                  >
                    {LANGUAGE_OPTIONS.map(langOpt => (
                      <option key={langOpt.id} value={langOpt.id}>{langOpt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Question Source Filter</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none transition-colors"
                  >
                    {SOURCE_OPTIONS.map(so => (
                      <option key={so.id} value={so.id}>{so.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional current affairs date filters */}
              {sourceFilter === 'current_affairs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#131A26]/50 p-4 border border-slate-800/80 rounded-lg animate-fadeIn">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Month (Optional)</label>
                    <select
                      value={selectedCAMonth}
                      onChange={(e) => setSelectedCAMonth(e.target.value)}
                      className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-slate-200 text-xs outline-none"
                    >
                      <option value="">All Months</option>
                      {MONTHS.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Year (Optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 2026"
                      value={selectedCAYear}
                      onChange={(e) => setSelectedCAYear(e.target.value)}
                      className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 rounded-lg py-1.5 px-3 text-slate-200 text-xs outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sticky Action Panel (Right Column) */}
          <div className="space-y-6">
            <div className="bg-[#0C121D]/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-lg sticky top-6 space-y-6">
              <h2 className="text-lg font-semibold text-white border-b border-slate-800 pb-3 flex items-center">
                <FiClock className="text-emerald-500 mr-2" /> 3. Timing & Limit
              </h2>

              {/* Time Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Practice Session Time</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {TIME_PRESETS.slice(0, 4).map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTimePreset(preset.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                        timePreset === preset.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                          : 'bg-[#131A26] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTimePreset('custom')}
                    className={`col-span-2 py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      timePreset === 'custom'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-[#131A26] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Custom Practice Time
                  </button>
                </div>

                {timePreset === 'custom' && (
                  <div className="mb-2">
                    <input
                      type="number"
                      placeholder="Minutes (e.g. 25)"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Question Count Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Question Count Mode</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setQuestionCountMode('auto')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      questionCountMode === 'auto'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-[#131A26] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Auto-Calculate
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionCountMode('custom')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                      questionCountMode === 'custom'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-[#131A26] text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    Manual Count
                  </button>
                </div>

                {questionCountMode === 'custom' && (
                  <div>
                    <input
                      type="number"
                      placeholder="Question Count (e.g. 20)"
                      value={customQuestionCount}
                      onChange={(e) => setCustomQuestionCount(e.target.value)}
                      className="w-full bg-[#131A26] border border-slate-800 focus:border-emerald-500 rounded-lg py-2 px-3 text-slate-200 text-sm outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Available Question Count Live Badge */}
              <div className="bg-[#131A26]/50 p-4 border border-slate-800 rounded-lg text-center space-y-2">
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">Live Matches Available</span>
                {counting ? (
                  <div className="h-6 flex items-center justify-center">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={`text-2xl font-bold ${availableCount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {availableCount}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {availableCount > 0 
                        ? 'Questions ready for selection'
                        : 'Change filters to load questions'
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Start Button */}
              <button
                type="button"
                onClick={handleStartPractice}
                disabled={submitting || availableCount === 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <FiPlay /> Start Practice Session
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
