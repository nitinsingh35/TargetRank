import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiBookOpen, FiPlay, FiSearch, FiSliders, FiFilter,
  FiAlertCircle, FiLoader, FiChevronLeft, FiChevronRight, FiClock,
  FiBook, FiAward, FiEdit3
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import answerWritingAPI from '../../api/answerWritingApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function AnswerWritingLibrary() {
  const navigate = useNavigate();

  // List states
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdowns filters lists
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selected filters
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDiff, setSelectedDiff] = useState('');
  const [selectedMarks, setSelectedMarks] = useState('');

  // Load exams initially
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data || []);
      } catch (err) {
        console.warn('Failed to load exams list', err);
      }
    };
    loadExams();
  }, []);

  // Load syllabus details when exam changes
  useEffect(() => {
    if (!selectedExam) {
      setPhases([]);
      setSubjects([]);
      setTopics([]);
      setSelectedPhase('');
      setSelectedSubject('');
      setSelectedTopic('');
      return;
    }

    const loadSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        setPhases(data.phases || []);
        setSubjects(data.subjects || []);
        setTopics(data.topics || []);
        // Reset selectors
        setSelectedPhase('');
        setSelectedSubject('');
        setSelectedTopic('');
      } catch (err) {
        console.warn('Failed to load syllabus items', err);
      }
    };
    loadSyllabus();
  }, [selectedExam]);

  // Fetch descriptive questions list
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 9,
      };

      if (selectedExam)    params.examId = selectedExam;
      if (selectedPhase)   params.phaseId = selectedPhase;
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedTopic)   params.topicId = selectedTopic;
      if (selectedYear)    params.year = Number(selectedYear);
      if (selectedType)    params.sourceType = selectedType;
      if (selectedDiff)    params.difficulty = selectedDiff;
      if (selectedMarks)   params.marks = Number(selectedMarks);

      const { data } = await answerWritingAPI.getQuestions(params);
      if (data.success) {
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        throw new Error('Failed to load descriptive questions.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch descriptive questions.');
      toast.error('Error loading questions bank.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedPhase, selectedSubject, selectedTopic, selectedYear, selectedType, selectedDiff, selectedMarks]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handlePageChange = (p) => {
    if (p >= 1 && p <= pages) setPage(p);
  };

  const handleClearFilters = () => {
    setSelectedExam('');
    setSelectedPhase('');
    setSelectedSubject('');
    setSelectedTopic('');
    setSelectedYear('');
    setSelectedType('');
    setSelectedDiff('');
    setSelectedMarks('');
    setPage(1);
    setSearchQuery('');
  };

  // Filter list on client-side search query
  const filteredQuestions = questions.filter(q =>
    q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.paperName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiEdit3 className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Mains descriptive practice</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Answer Writing Practice</h1>
          <p className="text-slate-500 text-sm mt-1">
            Solve descriptive essay/answer questions. Submit sheets or texts for expert human mentor evaluation.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Answer Writing Practice" />

          {/* Right Main workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Filters panel */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Syllabus Filters
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Filters grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Exam select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Exams</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {/* Stage select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stage</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedPhase}
                    onChange={(e) => { setSelectedPhase(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold disabled:opacity-30"
                  >
                    <option value="">All Stages</option>
                    {phases.map(ph => (
                      <option key={ph._id} value={ph._id}>{ph.title}</option>
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
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold disabled:opacity-30"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.title}</option>
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
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold disabled:opacity-30"
                  >
                    <option value="">All Topics</option>
                    {topics.map(t => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {/* Year select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paper Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Years</option>
                    {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>

                {/* Source Type select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Source Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Sources</option>
                    <option value="previous_year">Previous Year PYQ</option>
                    <option value="practice">Practice Drill</option>
                    <option value="current_affairs">Current Affairs</option>
                    <option value="mentor_created">Mentor Selected</option>
                  </select>
                </div>

                {/* Difficulty select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                  <select
                    value={selectedDiff}
                    onChange={(e) => { setSelectedDiff(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                {/* Marks select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Question Marks</label>
                  <select
                    value={selectedMarks}
                    onChange={(e) => { setSelectedMarks(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Marks</option>
                    <option value="10">10 Marks</option>
                    <option value="15">15 Marks</option>
                    <option value="20">20 Marks</option>
                    <option value="25">25 Marks</option>
                  </select>
                </div>

              </div>

              {/* Search text field */}
              <div className="relative pt-1">
                <FiSearch className="absolute left-3.5 top-4.5 text-slate-550 text-sm" />
                <input
                  type="text"
                  placeholder="Search descriptive questions by keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-550"
                />
              </div>

            </div>

            {/* List area */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FiLoader className="text-3xl text-brand-500 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading questions list...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchQuestions} className="btn-primary text-xs px-4 py-2">
                  Retry Load
                </button>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiBookOpen className="text-4xl text-slate-550 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Questions Available</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No descriptive questions are available for this filter yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Cards Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {filteredQuestions.map((q) => {
                    return (
                      <div key={q._id} className="glass-card p-5 border-slate-800 bg-dark-900/30 flex flex-col justify-between gap-4">
                        
                        {/* Upper row details */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 flex-wrap gap-2">
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="uppercase text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">
                                {q.marks} Marks
                              </span>
                              <span className="bg-slate-850 border border-slate-750 px-2 py-0.5 rounded text-slate-350">
                                {q.suggestedWordLimit} Words
                              </span>
                              {q.suggestedTimeMinutes > 0 && (
                                <span className="bg-slate-850 border border-slate-750 px-2 py-0.5 rounded text-slate-350">
                                  {q.suggestedTimeMinutes} Mins
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1.5 capitalize text-slate-400">
                              <span>Source: {q.sourceType.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>Diff: {q.difficulty}</span>
                            </div>
                          </div>

                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-200 leading-relaxed line-clamp-3">
                            {q.questionText}
                          </h3>
                        </div>

                        {/* Middle subject chips */}
                        <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-400 bg-dark-950/40 p-2.5 rounded-xl border border-slate-850">
                          <span>Exam: {q.examId?.title || 'General'}</span>
                          <span>•</span>
                          <span>Subject: {q.subjectId?.title || 'General Studies'}</span>
                          <span>•</span>
                          <span>Topic: {q.topicId?.title || 'Concept'}</span>
                        </div>

                        {/* Lower Action buttons */}
                        <div className="flex items-center justify-between border-t border-slate-850/60 pt-3 flex-wrap gap-3">
                          
                          <div className="text-[10px] font-bold flex items-center gap-1.5">
                            {q.hasSubmissions ? (
                              <span className="text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                                Already Practiced
                              </span>
                            ) : (
                              <span className="text-slate-500 bg-slate-850 px-2 py-1 rounded">
                                Not Attempted
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => navigate(`/aspirant/answer-writing/question/${q._id}`)}
                            className="btn-primary py-2 px-5 text-xs font-bold shadow-md shadow-brand-500/15"
                          >
                            <FiEdit3 />
                            <span>{q.hasSubmissions ? 'Write Another Answer' : 'Start Writing'}</span>
                          </button>

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
                      Page {page} of {pages} ({total} total questions)
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
