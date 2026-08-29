import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiAlertCircle, FiPlay, FiBookOpen, FiSliders, FiLoader,
  FiTrendingDown, FiBook, FiAward, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import revisionAPI from '../../api/revisionApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function WeakTopics() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Core data states
  const [weakTopics, setWeakTopics] = useState([]);
  const [weakSubjects, setWeakSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected exam/phase context for generating practice sessions
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');

  const [startingSessionId, setStartingSessionId] = useState(null);

  // 1. Fetch initial exams list and weak topics on mount
  useEffect(() => {
    fetchWeakTopics();
    loadExams();
  }, []);

  // 2. Load phases when exam changes
  useEffect(() => {
    if (!selectedExam) {
      setPhases([]);
      setSelectedPhase('');
      return;
    }
    const loadPhases = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        setPhases(data.phases || []);
        if (data.phases?.length > 0) {
          setSelectedPhase(data.phases[0]._id);
        } else {
          setSelectedPhase('');
        }
      } catch (err) {
        console.warn('Failed to load stages', err);
      }
    };
    loadPhases();
  }, [selectedExam]);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data || []);
      if (data?.length > 0) {
        setSelectedExam(data[0]._id);
      }
    } catch (err) {
      console.warn('Failed to load exams', err);
    }
  };

  const fetchWeakTopics = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await revisionAPI.getWeakTopics();
      if (data.success) {
        setWeakTopics(data.weakTopics || []);
        setWeakSubjects(data.weakSubjects || []);
      } else {
        throw new Error('Failed to load weak topics data.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Failed to fetch weak topics history. Make sure you have completed submitted practices.'
      );
    } finally {
      setLoading(false);
    }
  };

  // POST /api/revision/weak-topics/start
  const handleStartPractice = async (topicId) => {
    if (!selectedExam || !selectedPhase) {
      toast.error('Please select a Target Exam and Stage above to generate a practice session.');
      return;
    }

    setStartingSessionId(topicId);
    const toastId = toast.loading('Creating customized weak-topic practice session...');
    try {
      const { data } = await revisionAPI.startWeakTopicSession({
        topicIds: [topicId],
        questionCount: 15,
        examId: selectedExam,
        phaseId: selectedPhase,
      });

      if (data.success && data.sessionId) {
        toast.success('Practice session generated!', { id: toastId });
        navigate(`/aspirant/practice-session/${data.sessionId}`);
      } else {
        throw new Error('No session ID returned.');
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || 'Failed to generate custom practice session for this weak topic.',
        { id: toastId }
      );
    } finally {
      setStartingSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Analyzing performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiTrendingDown className="text-rose-400" />
            <span className="text-xs font-semibold text-rose-450 uppercase tracking-widest">Focus Areas</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Weak Topics Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">
            Topics where your score accuracy fell below 50% across practice sessions. Generate custom practice sheets here.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="Weak Topics" />

          {/* Right Main Content */}
          <div className="flex-1 w-full space-y-6">

            {/* Exam context configuration selector */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Practice Setup Context</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Select context parameters used when clicking "Start Weak Topic Practice".
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">Select Exam</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam Stage / Phase</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold disabled:opacity-40"
                  >
                    <option value="">Select Stage</option>
                    {phases.map(ph => (
                      <option key={ph._id} value={ph._id}>{ph.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">Analysis Sync Issue</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">{error}</p>
                <button onClick={fetchWeakTopics} className="btn-primary text-xs px-4 py-2 mx-auto">
                  Retry Analysis
                </button>
              </div>
            )}

            {/* Empty state */}
            {!error && weakTopics.length === 0 && (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiAward className="text-4xl text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">Excellent Standing!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You do not have any weak topics detected. Maintain scoring above 50% on all syllabus practice sessions to keep this status!
                </p>
                <Link to="/aspirant/smart-practice" className="btn-primary text-xs px-4 py-2 mx-auto justify-center">
                  Go to Smart Practice
                </Link>
              </div>
            )}

            {/* Data grid display */}
            {!error && weakTopics.length > 0 && (
              <div className="space-y-4">
                
                {/* Subjects warning section if any */}
                {weakSubjects.length > 0 && (
                  <div className="glass-card p-4 border-rose-500/20 bg-rose-500/5 space-y-2">
                    <h4 className="text-[10px] font-bold text-rose-450 uppercase tracking-wider flex items-center gap-1.5">
                      <FiAlertCircle /> Priority Subject Warnings
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {weakSubjects.map((ws, idx) => (
                        <span key={idx} className="text-[9px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/15 px-2.5 py-1 rounded">
                          {ws.subjectName} ({ws.accuracy}% accuracy)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak topics cards */}
                <div className="grid grid-cols-1 gap-4">
                  {weakTopics.map((wt, idx) => {
                    const isProcessing = startingSessionId === wt.topicId;
                    return (
                      <div key={idx} className="glass-card p-5 border-rose-550/20 bg-rose-550/5/10 hover:bg-dark-900/10 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                        
                        {/* Left description details */}
                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase">
                              Accuracy: {wt.accuracy}%
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold bg-dark-950 px-2 py-0.5 rounded">
                              Incorrect: {wt.incorrectCount} / {wt.attempted} attempted
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-extrabold text-white truncate">{wt.topicName}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5">Subject: {wt.subjectName || 'General'}</p>
                          </div>

                          <p className="text-xs text-slate-400 italic">
                            {wt.suggestedAction}
                          </p>
                        </div>

                        {/* Right action triggers */}
                        <div className="flex gap-2.5 self-end sm:self-center shrink-0">
                          
                          <button
                            onClick={() => navigate(`/aspirant/mistake-notebook?topicId=${wt.topicId}`)}
                            className="btn-secondary py-2 px-3.5 text-[11px] font-bold border-slate-850 hover:bg-dark-900"
                          >
                            <FiBookOpen /> Revise Mistakes
                          </button>

                          <button
                            onClick={() => handleStartPractice(wt.topicId)}
                            disabled={isProcessing}
                            className="btn-primary py-2 px-4 text-[11px] font-bold shadow-md shadow-brand-500/10"
                          >
                            {isProcessing ? (
                              <FiLoader className="text-xs animate-spin" />
                            ) : (
                              <><FiPlay /> Start Weak Topic Practice</>
                            )}
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
