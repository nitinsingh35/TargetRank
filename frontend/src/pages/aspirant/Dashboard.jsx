import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBookOpen, FiTarget, FiClock, FiPlay, FiAward, 
  FiCheckSquare, FiSliders, FiEdit3, FiEye, FiLoader, 
  FiAlertCircle, FiRefreshCw, FiArrowRight, FiBook, FiLayers
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { dashboardAPI } from '../../api/api.js';

export default function AspirantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await dashboardAPI.getAspirantStats();
      if (data?.success) {
        setStats(data.dashboard);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch aspirant dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const welcomeName = stats?.welcomeName || user?.name || 'Aspirant';
  const availableTutorials = stats?.availableTutorials || 0;
  const availableMockTests = stats?.availableMockTests || 0;
  const availablePYQPapers = stats?.availablePYQPapers || 0;
  const currentAffairsPacks = stats?.currentAffairsPacks || 0;
  const todayRevisionCount = stats?.todayRevisionCount || 0;
  const recentPractice = Array.isArray(stats?.recentPractice) ? stats.recentPractice : [];
  const recommendedActions = Array.isArray(stats?.recommendedActions) ? stats.recommendedActions : [];
  const continueLearning = Array.isArray(stats?.continueLearning) ? stats.continueLearning : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border-rose-500/20 p-8 text-center space-y-4">
          <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Dashboard Failed to Load</h2>
          <p className="text-xs text-slate-450">{error}</p>
          <button
            onClick={fetchStats}
            className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <FiRefreshCw /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Check if everything is completely empty (empty database)
  const isDbEmpty = 
    availableTutorials === 0 && 
    availableMockTests === 0 && 
    availablePYQPapers === 0 && 
    currentAffairsPacks === 0;

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-5%] w-[450px] h-[450px] bg-accent-500/5 rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header / Welcome card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiAward className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Aspirant Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Welcome back, {welcomeName}! 👋</h1>
            <p className="text-slate-400 text-sm mt-1">Ready to scale up your preparation and raise your exam rank today?</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/aspirant/smart-practice" className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-brand-500/10">
              <FiPlay /> Smart Practice
            </Link>
            <Link to="/aspirant/topic-practice" className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 bg-emerald-600 hover:bg-emerald-500 text-white">
              <FiLayers /> Topic Practice
            </Link>
            <Link to="/aspirant/tutorials" className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5">
              <FiBookOpen /> Learn Tutorials
            </Link>
          </div>
        </div>

        {/* Database Empty State Warn */}
        {isDbEmpty && (
          <div className="glass-card p-6 border-amber-500/25 bg-amber-500/5 text-center space-y-3">
            <FiBook className="text-3xl text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-white">Preparation Content Under Development</h3>
            <p className="text-xs text-slate-450 max-w-lg mx-auto">
              Your preparation content is being added. You can start by exploring available tutorials or creating practice through Smart Practice.
            </p>
          </div>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Tutorial Topics</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{availableTutorials}</p>
          </div>
          <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Mock Tests</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{availableMockTests}</p>
          </div>
          <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">PYQ Papers</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{availablePYQPapers}</p>
          </div>
          <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">CA Packs</p>
            <p className="text-xl font-extrabold text-white mt-0.5">{currentAffairsPacks}</p>
          </div>
          <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Pending Revisions</p>
            <p className={`text-xl font-extrabold mt-0.5 ${todayRevisionCount > 0 ? 'text-rose-450' : 'text-slate-400'}`}>
              {todayRevisionCount}
            </p>
          </div>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <Link to="/aspirant/smart-practice" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiPlay className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Smart Practice</p>
          </Link>
          <Link to="/aspirant/topic-practice" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiLayers className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Topic Practice</p>
          </Link>
          <Link to="/aspirant/mock-tests" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiCheckSquare className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Mock Tests</p>
          </Link>
          <Link to="/aspirant/pyq-papers" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiAward className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">PYQ Papers</p>
          </Link>
          <Link to="/aspirant/current-affairs" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiBookOpen className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Current Affairs</p>
          </Link>
          <Link to="/aspirant/tutorials" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiBook className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Tutorials</p>
          </Link>
          <Link to="/aspirant/revise-today" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiClock className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Revise Today</p>
          </Link>
          <Link to="/aspirant/mistake-notebook" className="glass-card p-3.5 hover:border-brand-500/40 transition-all text-center space-y-1 bg-dark-900/30">
            <FiTarget className="text-brand-400 mx-auto text-base" />
            <p className="text-[11px] font-bold text-white">Mistakes Book</p>
          </Link>
        </div>

        {/* Recommended Actions */}
        {recommendedActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recommended Next Steps</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedActions.map((act) => (
                <div key={act.actionId} className="glass-card p-4 border-brand-500/20 bg-brand-500/5 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-white">{act.title}</p>
                    <p className="text-[11px] text-slate-400 leading-normal">{act.description}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (act.actionId === 'revise_today') navigate('/aspirant/revise-today');
                      if (act.actionId === 'smart_practice') navigate('/aspirant/smart-practice');
                      if (act.actionId === 'learn_tutorials') navigate('/aspirant/tutorials');
                    }}
                    className="btn-primary shrink-0 py-2 px-3 text-[10px] font-bold flex items-center gap-1"
                  >
                    Action <FiArrowRight />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Learning + Recommended Practice grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Column: Continue Learning */}
          <div className="lg:col-span-3 bg-dark-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Continue Learning</h4>
              <Link to="/aspirant/my-learning" className="text-[10px] text-brand-400 font-bold hover:underline">
                My Learning Progress
              </Link>
            </div>
            
            {continueLearning.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-xs text-slate-500 italic">No tutorials in progress.</p>
                <Link to="/aspirant/tutorials" className="btn-secondary inline-flex py-2 px-4 text-[10px] font-bold">
                  Start learning from available tutorials
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {continueLearning.slice(0, 4).map((item) => (
                  <div key={item._id} className="p-3 bg-dark-950/50 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                      <p className="text-[9px] text-slate-500">{item.subjectName} • {item.progressPercent}% completed</p>
                    </div>
                    <Link to={`/aspirant/tutorials/${item.tutorialId}`} className="btn-primary py-1.5 px-3 text-[10px] font-bold shrink-0">
                      Resume
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recommended Practice */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-850">
                Recommended Practice
              </h4>
              <div className="space-y-2">
                <Link 
                  to="/aspirant/smart-practice" 
                  className="w-full text-left p-3 rounded-xl bg-dark-950/40 border border-slate-850 hover:border-brand-500/40 transition-colors flex items-center justify-between text-xs font-bold text-slate-200"
                >
                  <span>Practice General Knowledge</span>
                  <FiArrowRight className="text-brand-400" />
                </Link>
                <Link 
                  to="/aspirant/topic-practice" 
                  className="w-full text-left p-3 rounded-xl bg-dark-950/40 border border-slate-850 hover:border-brand-500/40 transition-colors flex items-center justify-between text-xs font-bold text-slate-200"
                >
                  <span>Practice Syllabus by Topic</span>
                  <FiArrowRight className="text-brand-400" />
                </Link>
                <Link 
                  to="/aspirant/mock-tests" 
                  className="w-full text-left p-3 rounded-xl bg-dark-950/40 border border-slate-850 hover:border-brand-500/40 transition-colors flex items-center justify-between text-xs font-bold text-slate-200"
                >
                  <span>Start a Mock Test</span>
                  <FiArrowRight className="text-brand-400" />
                </Link>
                <Link 
                  to="/aspirant/tutorials" 
                  className="w-full text-left p-3 rounded-xl bg-dark-950/40 border border-slate-850 hover:border-brand-500/40 transition-colors flex items-center justify-between text-xs font-bold text-slate-200"
                >
                  <span>Browse Tutorials</span>
                  <FiArrowRight className="text-brand-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-850">Recent History</h4>
          {recentPractice.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic text-center py-4">No recent practice attempts recorded.</p>
          ) : (
            <div className="space-y-3">
              {recentPractice.map((item) => (
                <div key={item._id} className="flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-350 capitalize">{item.examName} ({item.mode.replace('_', ' ')})</p>
                    <p className="text-[9px] text-slate-550">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{item.correctCount}/{item.totalQuestions} Correct</p>
                    <p className="text-[9px] text-slate-500 capitalize">Status: {item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
