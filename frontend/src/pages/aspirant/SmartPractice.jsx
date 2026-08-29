import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiSliders, FiPlay, FiBookOpen, FiClock, FiBarChart2,
  FiFilter, FiRotateCcw, FiAlertCircle, FiCheck, FiX, FiInfo
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import practiceAPI from '../../api/practiceApi.js';
import examAPI from '../../api/examApi.js';

const PRACTICE_MODES = [
  { id: 'smart_mixed', name: 'Smart Mixed Practice', desc: 'Adaptive mix of PYQ, high-weightage & weak topics' },
  { id: 'important_only', name: 'Important Questions Practice', desc: 'Focus on high-weightage important questions' },
  { id: 'pyq_only', name: 'PYQ Only Practice', desc: 'Verified previous year questions only' },
  { id: 'pyq_important_mixed', name: 'PYQ + Important Mixed', desc: 'Previous year + important practice combined' },
  { id: 'weak_topics', name: 'Weak Topics Practice', desc: 'Practice your identified weak areas' },
  { id: 'revision_mode', name: 'Revision Practice', desc: 'Quick revision from your mistake notebook' },
  { id: 'subject_wise', name: 'Subject-wise Practice', desc: 'Deep dive into a single subject' },
  { id: 'topic_wise', name: 'Topic-wise Practice', desc: 'Master a specific topic in depth' },
  { id: 'full_mock', name: 'Full Exam Pattern Mock', desc: 'Complete exam simulation with all sections' },
  { id: 'custom_mock', name: 'Custom Mock Test', desc: 'Build your own custom test' },
];

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Mixed'];
const LANGUAGE_OPTIONS = [
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'bilingual', label: 'Both' },
];
const SOURCE_OPTIONS = [
  { id: 'all', label: 'All Available Questions' },
  { id: 'official_pyq', label: 'Official PYQ Only' },
  { id: 'original_practice', label: 'Original Practice Only' },
  { id: 'current_affairs', label: 'Current Affairs Practice' },
];
const DURATION_PRESETS = [10, 15, 30, 45, 60, 90, 120];

export default function SmartPractice() {
  const navigate = useNavigate();

  // Fetch data
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedMode, setSelectedMode] = useState('smart_mixed');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [difficultyPreference, setDifficultyPreference] = useState('mixed');
  const [languagePreference, setLanguagePreference] = useState('english');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [allowRepeats, setAllowRepeats] = useState(false);
  const [selectedCAMonth, setSelectedCAMonth] = useState('');
  const [selectedCAYear, setSelectedCAYear] = useState('');

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableQuestionCount, setAvailableQuestionCount] = useState(0);
  const [estimatedQuestionCount, setEstimatedQuestionCount] = useState(15);
  const [config, setConfig] = useState(null);

  // Initialize exams
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
        toast.error('Failed to load exams');
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  // Load phases when exam changes
  useEffect(() => {
    if (!selectedExamId) {
      setPhases([]);
      setSelectedPhaseId('');
      setSubjects([]);
      setTopics([]);
      setSelectedSubjectIds([]);
      setSelectedTopicIds([]);
      setAvailableQuestionCount(0);
      return;
    }

    const fetchPhases = async () => {
      try {
        const { data } = await examAPI.getExamBySlug(
          exams.find(e => e._id === selectedExamId)?.slug || ''
        );
        
        if (data.phases && data.phases.length > 0) {
          setPhases(data.phases);
          setSelectedPhaseId(data.phases[0]._id);
        }
      } catch (err) {
        console.error('Error fetching phases:', err);
      }
    };
    
    fetchPhases();
  }, [selectedExamId, exams]);

  // Load subjects and topics when phase changes
  useEffect(() => {
    if (!selectedExamId || !selectedPhaseId) {
      setSubjects([]);
      setTopics([]);
      setSelectedSubjectIds([]);
      setSelectedTopicIds([]);
      return;
    }

    const fetchSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExamId);
        
        if (data.syllabus) {
          let allSubjects = [];
          let allTopics = [];
          
          const phase = data.syllabus.find(p => p._id === selectedPhaseId);
          if (phase && phase.subjects) {
            phase.subjects.forEach(sub => {
              allSubjects.push(sub);
              if (sub.topics) {
                sub.topics.forEach(top => {
                  allTopics.push(top);
                });
              }
            });
          }
          
          setSubjects(allSubjects);
          setTopics(allTopics);
          setSelectedSubjectIds([]);
          setSelectedTopicIds([]);
        }
      } catch (err) {
        console.error('Error fetching syllabus:', err);
      }
    };

    fetchSyllabus();
  }, [selectedExamId, selectedPhaseId]);

  // Load config and update calculations
  useEffect(() => {
    if (!selectedExamId || !selectedPhaseId) return;

    const loadConfig = async () => {
      try {
        const { data } = await practiceAPI.getConfig(selectedExamId, selectedPhaseId);
        if (data.success && data.config) {
          setConfig(data.config);
        }
      } catch (err) {
        console.error('Error fetching config:', err);
      }
    };

    loadConfig();
  }, [selectedExamId, selectedPhaseId]);

  // Calculate estimated question count when time/config changes
  useEffect(() => {
    if (!config) return;
    
    const finalMins = customDuration && customDuration > 0 ? Number(customDuration) : durationMinutes;
    const minPerQ = config.defaultMinutesPerQuestion || 1.5;
    const estimated = Math.floor(finalMins / minPerQ);
    setEstimatedQuestionCount(Math.max(1, estimated));
  }, [durationMinutes, customDuration, config]);

  // Fetch available question count
  useEffect(() => {
    const fetchAvailableCount = async () => {
      if (!selectedExamId) return;

      try {
        const params = {
          examId: selectedExamId,
          difficulty: difficultyPreference,
          language: languagePreference,
          sourceFilter: sourceFilter,
        };
        
        if (selectedPhaseId) params.phaseId = selectedPhaseId;
        if (selectedSubjectIds.length > 0) params.subjectIds = selectedSubjectIds.join(',');
        if (selectedTopicIds.length > 0) params.topicIds = selectedTopicIds.join(',');

        const { data } = await practiceAPI.getAvailableQuestionCount(params);
        setAvailableQuestionCount(data.availableQuestionCount || 0);
      } catch (err) {
        console.error('Error fetching question count:', err);
        setAvailableQuestionCount(0);
      }
    };

    const timer = setTimeout(fetchAvailableCount, 500);
    return () => clearTimeout(timer);
  }, [selectedExamId, selectedPhaseId, selectedSubjectIds, selectedTopicIds, difficultyPreference, languagePreference, sourceFilter]);

  // Handlers
  const handleToggleSubject = (id) => {
    setSelectedSubjectIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleTopic = (id) => {
    setSelectedTopicIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setSelectedMode('smart_mixed');
    setDurationMinutes(30);
    setCustomDuration('');
    setSelectedSubjectIds([]);
    setSelectedTopicIds([]);
    setDifficultyPreference('mixed');
    setLanguagePreference('english');
    setSourceFilter('all');
    setAllowRepeats(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!selectedExamId) {
      toast.error('Please select an exam');
      return;
    }
    if (!selectedPhaseId) {
      toast.error('Please select a phase');
      return;
    }
    if (!selectedMode) {
      toast.error('Please select a practice mode');
      return;
    }

    const finalMins = customDuration && Number(customDuration) > 0 ? Number(customDuration) : durationMinutes;
    if (!finalMins || finalMins < 5 || finalMins > 300) {
      toast.error('Duration must be between 5 and 300 minutes');
      return;
    }

    setSubmitting(true);
    
    const loadingToastId = toast.loading('Creating practice setup...');

    try {
      const payload = {
        examId: selectedExamId,
        phaseId: selectedPhaseId,
        mode: selectedMode,
        durationMinutes: finalMins,
        subjectIds: selectedSubjectIds,
        topicIds: selectedTopicIds,
        difficultyPreference,
        language: languagePreference,
        sourceFilter,
        allowRepeats,
        currentAffairsMonth: sourceFilter === 'current_affairs' && selectedCAMonth ? Number(selectedCAMonth) : undefined,
        currentAffairsYear: sourceFilter === 'current_affairs' && selectedCAYear ? Number(selectedCAYear) : undefined,
      };

      const { data } = await practiceAPI.createSmartSession(payload);
      
      toast.success(data.message || 'Practice setup created!', { id: loadingToastId });

      // Redirect to practice history
      setTimeout(() => {
        navigate('/aspirant/practice-history', { 
          state: { newSessionId: data.session._id }
        });
      }, 800);
    } catch (err) {
      console.error('Error creating session:', err);
      toast.error(
        err.response?.data?.message || 'Failed to create practice setup',
        { id: loadingToastId }
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <FiBookOpen className="w-12 h-12 text-brand-400" />
          </div>
          <p className="mt-4 text-slate-400">Loading practice setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-5%] w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Back Navigation */}
        <Link
          to="/aspirant/dashboard"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FiSliders className="text-brand-400 text-lg" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Adaptive Practice Suite</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Smart Practice Setup</h1>
          <p className="text-slate-400 mt-1">Create a personalized practice session based on your learning goals and available time</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section A: Exam and Phase Selection */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FiFilter className="text-brand-400" />
              <h2 className="text-sm font-bold text-white">Step 1: Select Exam & Phase</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Exam */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Target Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-brand-500 transition"
                >
                  <option value="">Select Exam</option>
                  {exams.map(e => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
              </div>

              {/* Phase */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Exam Phase
                </label>
                <select
                  value={selectedPhaseId}
                  onChange={(e) => setSelectedPhaseId(e.target.value)}
                  disabled={!selectedExamId || phases.length === 0}
                  className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-brand-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Phase</option>
                  {phases.map(p => (
                    <option key={p._id} value={p._id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Practice Mode */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FiPlay className="text-brand-400" />
              <h2 className="text-sm font-bold text-white">Step 2: Choose Practice Mode</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRACTICE_MODES.map(modeOption => (
                <button
                  key={modeOption.id}
                  type="button"
                  onClick={() => setSelectedMode(modeOption.id)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedMode === modeOption.id
                      ? 'bg-brand-500/15 border-brand-500'
                      : 'bg-dark-950 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-4 h-4 rounded border-2 mt-0.5 flex-shrink-0 ${
                      selectedMode === modeOption.id
                        ? 'bg-brand-500 border-brand-500'
                        : 'border-slate-600'
                    }`} />
                    <div>
                      <p className="text-xs font-semibold text-white">{modeOption.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{modeOption.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section C: Available Study Time */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FiClock className="text-brand-400" />
              <h2 className="text-sm font-bold text-white">Step 3: Available Study Time</h2>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => { setDurationMinutes(time); setCustomDuration(''); }}
                    className={`px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      durationMinutes === time && !customDuration
                        ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                        : 'bg-dark-950 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {time} min
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-slate-500">Or custom:</span>
                <input
                  type="number"
                  min="5"
                  max="300"
                  placeholder="5-300 min"
                  value={customDuration}
                  onChange={(e) => { setCustomDuration(e.target.value); setDurationMinutes(0); }}
                  className="w-32 bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            {/* Time Summary */}
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg flex items-center gap-3">
              <FiInfo className="text-brand-400 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-brand-300">
                  Estimated {estimatedQuestionCount} questions • {config?.defaultMinutesPerQuestion || 1.5} min/question
                </p>
              </div>
            </div>
          </div>

          {/* Section D: Subject and Topic Filters */}
          {(subjects.length > 0 || topics.length > 0) && (
            <div className="glass-card p-6 border-slate-800 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FiBarChart2 className="text-brand-400" />
                <h2 className="text-sm font-bold text-white">Step 4: Filter by Subject & Topic</h2>
              </div>

              {subjects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Subjects (Optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((sub) => (
                      <button
                        key={sub._id}
                        type="button"
                        onClick={() => handleToggleSubject(sub._id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                          selectedSubjectIds.includes(sub._id)
                            ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                            : 'bg-dark-950 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {sub.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {topics.length > 0 && selectedSubjectIds.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Topics (Optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {topics
                      .filter(t => selectedSubjectIds.length === 0 || selectedSubjectIds.includes(t.subjectId))
                      .map((topic) => (
                        <button
                          key={topic._id}
                          type="button"
                          onClick={() => handleToggleTopic(topic._id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            selectedTopicIds.includes(topic._id)
                              ? 'bg-accent-500/20 border-accent-500 text-accent-300'
                              : 'bg-dark-950 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {topic.title}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section E: Difficulty Preference */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Difficulty Level</p>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTY_OPTIONS.map((diff) => (
                <button
                  key={diff.toLowerCase()}
                  type="button"
                  onClick={() => setDifficultyPreference(diff.toLowerCase())}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    difficultyPreference === diff.toLowerCase()
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-dark-950 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Section F: Language Preference */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Language</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setLanguagePreference(lang.id)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    languagePreference === lang.id
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-dark-950 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section G: Question Source Preference */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Question Source Preference</p>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-brand-500"
            >
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>

            {sourceFilter === 'current_affairs' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Month (Optional)</label>
                  <select
                    value={selectedCAMonth}
                    onChange={(e) => setSelectedCAMonth(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-brand-500"
                  >
                    <option value="">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Year (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2026"
                    value={selectedCAYear}
                    onChange={(e) => setSelectedCAYear(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section H: Avoid Repeat Questions */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!allowRepeats}
                onChange={(e) => setAllowRepeats(!e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-dark-950 text-brand-500"
              />
              <span className="text-sm font-medium text-slate-300">
                Avoid questions attempted in the last 30 days
              </span>
            </label>
          </div>

          {/* Section I: Available Questions Alert */}
          {availableQuestionCount === 0 && (
            <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
              <FiAlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-400">Questions Not Available Yet</p>
                <p className="text-amber-300 mt-1">
                  Questions matching your filters are not available. You can still save this setup and use it after questions are added.
                </p>
              </div>
            </div>
          )}

          {/* Section J: Action Buttons */}
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary px-6 py-3 text-xs font-semibold flex items-center gap-2"
            >
              <FiRotateCcw className="text-sm" />
              Reset Filters
            </button>

            <button
              type="submit"
              disabled={submitting || !selectedExamId || !selectedPhaseId}
              className="btn-primary px-8 py-3 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck className="text-sm" />
              {submitting ? 'Saving...' : 'Save Practice Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
