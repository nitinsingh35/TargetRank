import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiAward, FiBookOpen, FiPlay, FiRefreshCw, FiAlertTriangle,
  FiTrendingUp, FiActivity, FiClock, FiCheckSquare, FiLoader,
  FiAlertCircle, FiChevronRight, FiSliders
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import contentAPI from '../../api/contentApi.js';
import examAPI from '../../api/examApi.js';
import practiceAPI from '../../api/practiceApi.js';

export default function ContentRecommendations() {
  const navigate = useNavigate();
  
  // Data states
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mock Builder states
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('');
  const [mockDifficulty, setMockDifficulty] = useState('mixed');
  const [mockDuration, setMockDuration] = useState(60);
  const [mockLanguage, setMockLanguage] = useState('english');
  const [buildingMock, setBuildingMock] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await contentAPI.intelligence.getRecommendations();
      if (data.success) {
        setRecs(data.recommendations);
      } else {
        throw new Error('Failed to load recommendations');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load recommendations.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadExams = useCallback(async () => {
    try {
      const { data } = await examAPI.getExams();
      if (data.success && data.exams?.length > 0) {
        setExams(data.exams);
        setSelectedExam(data.exams[0]._id);
      }
    } catch (err) {
      console.error('Failed to load exams', err);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
    loadExams();
  }, [fetchRecommendations, loadExams]);

  useEffect(() => {
    if (!selectedExam) {
      setPhases([]);
      setSelectedPhase('');
      return;
    }
    const fetchSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        if (data.success && data.phases?.length > 0) {
          setPhases(data.phases);
          setSelectedPhase(data.phases[0]._id);
        }
      } catch (err) {
        console.error('Failed to load phases', err);
      }
    };
    fetchSyllabus();
  }, [selectedExam]);

  // Start instant smart practice on a topic
  const startPractice = async (topicId, subjectId) => {
    try {
      const { data } = await practiceAPI.startSession({
        topicId,
        subjectId,
        mode: 'topic_practice',
        questionCount: 10
      });
      if (data.success && data.session?._id) {
        toast.success('Practice session created!');
        navigate(`/aspirant/practice/session/${data.session._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start practice.');
    }
  };

  // Run mock builder
  const buildMock = async (e) => {
    e.preventDefault();
    if (!selectedExam || !selectedPhase) {
      toast.error('Select exam and phase');
      return;
    }
    setBuildingMock(true);
    try {
      const { data } = await contentAPI.intelligence.buildMock({
        examId: selectedExam,
        phaseId: selectedPhase,
        difficulty: mockDifficulty,
        durationMinutes: mockDuration,
        language: mockLanguage
      });

      if (data.success) {
        if (data.shortage) {
          toast.error(data.shortageMessage);
        }
        
        // Convert to a custom mock session/practice attempt
        // We'll redirect to practice creator with these details
        toast.success(`Smart mock generated with ${data.total} questions.`);
        
        // Try creating standard practice session using mock parameters
        const res = await practiceAPI.startSession({
          examId: selectedExam,
          phaseId: selectedPhase,
          mode: 'smart_mixed',
          difficultyPreference: mockDifficulty,
          durationMinutes: mockDuration,
          language: mockLanguage,
          questionCount: data.total
        });

        if (res.data?.success && res.data?.session?._id) {
          navigate(`/aspirant/practice/session/${res.data.session._id}`);
        } else {
          toast.error('Could not redirect to mock practice session.');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to construct mock test.');
    } finally {
      setBuildingMock(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-xs font-semibold">Generating recommendations for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0d1117] border border-rose-500/20 rounded-2xl p-8 text-center space-y-4">
          <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Recommendations Unavailable</h2>
          <p className="text-xs text-slate-450">{error}</p>
          <button onClick={fetchRecommendations} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto">
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  const r = recs || {};

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-900">
          <div>
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <FiAward className="text-indigo-400" /> Smart Practice Recommendations
            </h1>
            <p className="text-slate-550 text-xs mt-0.5">
              Personalized practice suggestions based on weak areas, high-weightage topics and PYQs.
            </p>
          </div>
          <button onClick={fetchRecommendations}
            className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-700 hover:border-indigo-500 hover:text-white text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition-all">
            <FiRefreshCw /> Recalculate
          </button>
        </div>

        {/* Continue Learning Widget */}
        {r.continueLearning && (
          <div className="bg-gradient-to-r from-indigo-950/20 to-indigo-900/10 border border-indigo-900/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Continue Learning</span>
              <h4 className="text-sm font-bold text-white">{r.continueLearning.topicName}</h4>
              <p className="text-[10px] text-slate-500">
                Last active on {new Date(r.continueLearning.lastActive).toLocaleDateString('en-IN')} with accuracy score of {r.continueLearning.progress}%
              </p>
            </div>
            <button
              onClick={() => startPractice(r.continueLearning.topicId)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-lg shadow-indigo-500/10"
            >
              <FiPlay className="text-[10px]" /> Resume Practice
            </button>
          </div>
        )}

        {/* Split Layout: Recommendations vs Smart Mock Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left / Center - Recommendations Cards */}
          <div className="lg:col-span-2 space-y-6">

            {/* Weak Topics */}
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiAlertTriangle className="text-rose-400" /> Weak Topics (Needs Work)
              </h3>
              <p className="text-[10px] text-slate-500">Topics with under 40% accuracy scores in practice sessions.</p>
              
              {(!r.weakTopics || r.weakTopics.length === 0) ? (
                <p className="text-slate-550 text-xs py-4 text-center">Great! No critical weak topics identified yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {r.weakTopics.map((item, idx) => (
                    <div key={idx} className="bg-[#080d13] border border-slate-900 hover:border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3 group transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{item.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">Accuracy: <span className="text-rose-400 font-bold">{item.accuracy}%</span> ({item.attempted} Qs)</p>
                      </div>
                      <button 
                        onClick={() => startPractice(item.topicId, item.subjectId)}
                        className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-455 p-2 rounded-lg transition-all shrink-0"
                        title="Practice Now"
                      >
                        <FiPlay className="text-[10px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High Weightage & Unseen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* High Weightage */}
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FiTrendingUp className="text-emerald-400" /> High Weightage Topics
                </h3>
                <div className="space-y-2.5">
                  {(!r.highWeightageTopics || r.highWeightageTopics.length === 0) ? (
                    <p className="text-slate-550 text-xs py-4 text-center">No weightage targets setup yet.</p>
                  ) : r.highWeightageTopics.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#080d13] p-2.5 rounded-lg border border-slate-900">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[11px] font-bold text-slate-350 truncate">{t.title}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-450 font-black shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {t.weightagePercent}% wt
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unseen PYQs */}
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FiClock className="text-amber-400" /> Unattempted PYQs
                </h3>
                <div className="space-y-2.5">
                  {(!r.unseenPYQTopics || r.unseenPYQTopics.length === 0) ? (
                    <p className="text-slate-550 text-xs py-4 text-center">You have completed all available PYQs! 🎉</p>
                  ) : r.unseenPYQTopics.slice(0, 5).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#080d13] p-2.5 rounded-lg border border-slate-900">
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-[11px] font-bold text-slate-350 truncate">{t.topicName}</p>
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0 bg-amber-500/10 px-2 py-0.5 rounded">
                        {t.count} Unseen
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Revision Suggestions */}
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-3.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FiActivity className="text-violet-400" /> Spaced Repetition Due
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Questions overdue for revision attempts according to memory retention intervals.</p>
              
              {(!r.revisionSuggestions || r.revisionSuggestions.length === 0) ? (
                <p className="text-slate-550 text-xs py-4 text-center">All caught up! No active revision items currently due.</p>
              ) : (
                <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden bg-[#080d13]">
                  {r.revisionSuggestions.map((item, idx) => (
                    <div key={idx} className="px-4 py-3 flex items-center justify-between gap-4">
                      <p className="text-xs text-slate-300 leading-normal line-clamp-1 flex-1">{item.questionText}...</p>
                      <Link 
                        to={`/aspirant/revision/practice`}
                        className="flex items-center gap-1 bg-violet-600/15 hover:bg-violet-600 hover:text-white border border-violet-500/20 text-violet-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0"
                      >
                        Revise <FiChevronRight />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right - Smart Mock Builder Form */}
          <div className="space-y-6">
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FiSliders className="text-indigo-400" /> Smart Mock Builder
                </h3>
                <p className="text-[10px] text-slate-500 mt-1">Generate a dynamically balanced simulation mock based on availability metrics.</p>
              </div>

              <form onSubmit={buildMock} className="space-y-4 pt-1">
                {/* Exam */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Exam Type</label>
                  <select
                    value={selectedExam}
                    onChange={e => setSelectedExam(e.target.value)}
                    className="w-full bg-[#080d13] border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                  >
                    {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                  </select>
                </div>

                {/* Phase */}
                {phases.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Phase</label>
                    <select
                      value={selectedPhase}
                      onChange={e => setSelectedPhase(e.target.value)}
                      className="w-full bg-[#080d13] border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                    >
                      {phases.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                    </select>
                  </div>
                )}

                {/* Difficulty */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Mock Difficulty</label>
                  <select
                    value={mockDifficulty}
                    onChange={e => setMockDifficulty(e.target.value)}
                    className="w-full bg-[#080d13] border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="mixed">Mixed Balance</option>
                    <option value="easy">Easy Foundation</option>
                    <option value="medium">Standard Medium</option>
                    <option value="hard">Challenge Hard</option>
                  </select>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Duration (Minutes)</label>
                  <select
                    value={mockDuration}
                    onChange={e => setMockDuration(Number(e.target.value))}
                    className="w-full bg-[#080d13] border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                    <option value={90}>90 Minutes</option>
                    <option value={120}>120 Minutes</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Language</label>
                  <select
                    value={mockLanguage}
                    onChange={e => setMockLanguage(e.target.value)}
                    className="w-full bg-[#080d13] border border-slate-800 focus:border-indigo-500 text-slate-200 text-xs rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={buildingMock}
                  className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-650/20"
                >
                  {buildingMock ? (
                    <><FiLoader className="animate-spin text-xs" /> Constructing Mock...</>
                  ) : (
                    <><FiCheckSquare className="text-xs" /> Build & Start Mock</>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
