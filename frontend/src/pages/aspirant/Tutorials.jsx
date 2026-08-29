import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FiSearch, FiSliders, FiPlay, FiBookOpen, FiClock, 
  FiFileText, FiAward, FiInfo, FiLoader, FiAlertCircle, FiRefreshCw 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import tutorialAPI from '../../api/tutorialApi.js';
import examAPI from '../../api/examApi.js';

const EXAM_TABS = ['UPSC', 'BPSC', 'JPSC', 'UPPSC', 'SSC CGL', 'Banking', 'Railway', 'Defence'];
const PHASE_TABS = [
  { id: '', label: 'All Phases' },
  { id: 'prelims', label: 'Prelims' },
  { id: 'mains', label: 'Mains' },
  { id: 'interview', label: 'Interview' },
  { id: 'foundation', label: 'Foundation' },
];

export default function Tutorials() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected tab exam (defaults to UPSC or URL query param)
  const currentTab = searchParams.get('exam') || 'UPSC';
  const [activePhase, setActivePhase] = useState('');

  // Loader & stats states
  const [tutorials, setTutorials] = useState([]);
  const [examsList, setExamsList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Local state filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [tutorialType, setTutorialType] = useState('');
  const [language, setLanguage] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load: get exams metadata (to resolve titles to objectids)
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExamsList(data || []);
      } catch (err) {
        console.warn('Failed to load exams', err);
      }
    };
    loadExams();
  }, []);

  // Sync: when active exam tab or syllabus updates, load relevant subjects list
  useEffect(() => {
    const examObj = examsList.find(e => e.title.toLowerCase() === currentTab.toLowerCase());
    if (!examObj) return;

    const loadSubjects = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(examObj._id);
        setSubjectsList(data.subjects || []);
        setSelectedSubject(''); // Reset selected subject filter
      } catch (err) {
        console.warn('Failed to load subjects', err);
      }
    };
    loadSubjects();
  }, [currentTab, examsList]);

  // Load tutorials
  const fetchTutorialsList = async () => {
    setLoading(true);
    setError('');
    try {
      const examObj = examsList.find(e => e.title.toLowerCase() === currentTab.toLowerCase());
      
      const params = {};
      if (examObj) params.examId = examObj._id;
      if (activePhase) {
        // Resolve activePhase name to ObjectId in Phase list if applicable
        const phaseObj = examObj?.phases?.find(p => p.title.toLowerCase() === activePhase.toLowerCase());
        if (phaseObj) params.phaseId = phaseObj._id;
      }
      if (selectedSubject) params.subjectId = selectedSubject;
      if (tutorialType) params.tutorialType = tutorialType;
      if (language) params.language = language;
      if (difficulty) params.difficulty = difficulty;
      if (searchQuery) params.search = searchQuery;

      const { data } = await tutorialAPI.getTutorials(params);
      if (data?.success) {
        setTutorials(data.tutorials || []);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch tutorials list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examsList.length > 0) {
      fetchTutorialsList();
    }
  }, [currentTab, activePhase, selectedSubject, tutorialType, language, difficulty, examsList]);

  const handleTabChange = (examTitle) => {
    setSearchParams({ exam: examTitle });
  };

  const handleResetFilters = () => {
    setSelectedSubject('');
    setTutorialType('');
    setLanguage('');
    setDifficulty('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiBookOpen className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Tutorial Module</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Learn by Topic</h1>
          <p className="text-slate-400 text-sm mt-1">Study concepts and notes before testing your rank with practice simulators.</p>
        </div>

        {/* Tab List (Exam Tabs) */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          {EXAM_TABS.map((ex) => (
            <button
              key={ex}
              onClick={() => handleTabChange(ex)}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-extrabold transition-all border-b-2 ${
                currentTab.toLowerCase() === ex.toLowerCase()
                  ? 'border-brand-500 text-white bg-brand-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Phase Sub-Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {PHASE_TABS.map((p) => (
            <button
              key={p.label}
              onClick={() => setActivePhase(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition-all ${
                activePhase === p.id
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'bg-dark-900 border-slate-850 text-slate-400 hover:border-slate-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filters control block */}
        <div className="glass-card p-5 bg-dark-900/30 border-slate-850 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FiSliders className="text-brand-400" /> Filter Content
            </span>
            <button
              onClick={handleResetFilters}
              className="text-[10px] text-slate-400 hover:text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* Subject Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
              >
                <option value="">All Subjects</option>
                {subjectsList.map(s => (
                  <option key={s._id} value={s._id}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Type Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Format</label>
              <select
                value={tutorialType}
                onChange={(e) => setTutorialType(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
              >
                <option value="">All Formats</option>
                <option value="video">Video Lecture</option>
                <option value="article">Concept Article</option>
                <option value="notes">Summary Notes</option>
                <option value="pdf">PDF Resource</option>
                <option value="external_link">Web link</option>
              </select>
            </div>

            {/* Language Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
              >
                <option value="">All Languages</option>
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="bilingual">Bilingual</option>
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Search bar input */}
          <div className="relative pt-2">
            <FiSearch className="absolute left-3.5 top-5.5 text-slate-500 text-sm" />
            <input
              type="text"
              placeholder="Search tutorial title or short concept notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTutorialsList()}
              className="w-full bg-dark-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-550"
            />
          </div>
        </div>

        {/* Tutorials List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <FiLoader className="text-3xl text-brand-500 animate-spin" />
            <p className="text-slate-500 text-xs font-semibold">Gathering topics list...</p>
          </div>
        ) : error ? (
          <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
            <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">{error}</p>
            <button onClick={fetchTutorialsList} className="btn-primary text-xs px-4 py-2">
              <FiRefreshCw className="mr-1" /> Try Again
            </button>
          </div>
        ) : tutorials.length === 0 ? (
          <div className="glass-card border-slate-850 p-16 text-center space-y-4 max-w-lg mx-auto">
            <FiFileText className="text-4xl text-slate-500 mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white">No Tutorials Available</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No tutorials are available for this selected topic yet. Try another subject or check back later.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tutorials.map((item) => (
              <div key={item._id} className="glass-card border-slate-800 bg-dark-900/30 flex flex-col justify-between p-5 relative overflow-hidden">
                <div className="space-y-3">
                  {/* Image/Thumbnail placeholder or card icon header */}
                  {item.thumbnailUrl ? (
                    <img 
                      src={item.thumbnailUrl} 
                      alt={item.title} 
                      className="w-full h-32 object-cover rounded-xl border border-slate-850"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-24 bg-dark-950 border border-slate-850 rounded-xl flex items-center justify-center text-slate-600">
                      {item.tutorialType === 'video' ? <FiPlay className="text-2xl" /> : <FiFileText className="text-2xl" />}
                    </div>
                  )}

                  {/* Badges metadata row */}
                  <div className="flex flex-wrap gap-1.5 text-[9px] font-bold">
                    <span className="bg-brand-500/10 border border-brand-500/20 text-brand-400 px-2 py-0.5 rounded uppercase">
                      {item.tutorialType.replace('_', ' ')}
                    </span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded capitalize text-slate-400">
                      {item.contentLanguage}
                    </span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded capitalize text-slate-400">
                      {item.difficulty}
                    </span>
                    {item.durationMinutes > 0 && (
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-400 flex items-center gap-1">
                        <FiClock /> {item.durationMinutes} min
                      </span>
                    )}
                  </div>

                  {/* Title & ShortDesc */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-2" title={item.title}>
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mt-1">
                      {item.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Bottom stats and action CTA */}
                <div className="border-t border-slate-850 pt-3.5 mt-4 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {item.progressPercent > 0 ? (
                      <span className="text-brand-400 font-bold">{item.progressPercent}% read</span>
                    ) : (
                      <span>Unopened</span>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/aspirant/tutorials/${item._id}`)}
                    className="btn-primary py-1.5 px-4 text-[10px] font-bold flex items-center gap-1 shrink-0"
                  >
                    Start Learning
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
