import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiClock, FiBookOpen, FiBookmark, FiAlertCircle, FiTrendingUp,
  FiAward, FiActivity, FiArrowRight, FiPlay, FiLoader, FiSliders,
  FiEdit3, FiFileText, FiCheckSquare, FiUsers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import revisionAPI from '../../api/revisionApi.js';

// ── Left Sidebar Component (shared styling across revision pages) ────────────
export function RevisionSidebar({ active }) {
  const sidebarItems = [
    { label: 'Smart Practice',      path: '/aspirant/smart-practice',    icon: FiPlay,        comingSoon: false },
    { label: 'Mock Tests',          path: '/aspirant/mock-tests',        icon: FiCheckSquare, comingSoon: false },
    { label: 'PYQ Papers',          path: '/aspirant/pyq-papers',        icon: FiAward,       comingSoon: false },
    { label: 'PYQ Comparison',      path: '/aspirant/pyq-comparison',    icon: FiTrendingUp,  comingSoon: false },
    { label: 'Current Affairs',     path: '/aspirant/current-affairs',   icon: FiFileText,    comingSoon: false },
    { label: 'Current Affairs History',path: '/aspirant/current-affairs-history',icon: FiActivity,comingSoon: false },
    { label: 'Revise Today',        path: '/aspirant/revise-today',      icon: FiClock,       comingSoon: false },
    { label: 'Mistake Notebook',    path: '/aspirant/mistake-notebook',  icon: FiBookOpen,    comingSoon: false },
    { label: 'Answer Writing',      path: '/aspirant/answer-writing',    icon: FiEdit3,       comingSoon: false },
    { label: 'Interview Practice',  path: '#',                           icon: FiUsers,       comingSoon: true },
    { label: 'Performance Analytics',path: '#',                           icon: FiActivity,    comingSoon: true },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
      <div className="px-3 py-2">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Revision Hub</h2>
      </div>
      <nav className="space-y-1">
        {sidebarItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          if (item.comingSoon) {
            return (
              <div
                key={idx}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-none"
                title="Coming Soon"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="text-sm shrink-0" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Soon</span>
              </div>
            );
          }
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand-500/10 text-white border border-brand-500/20 shadow-md shadow-brand-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-dark-900 border border-transparent'
              }`}
            >
              <Icon className={`text-sm shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function RevisionDashboard() {
  const navigate = useNavigate();
  const [dbData, setDbData] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [resDb, resQueue] = await Promise.all([
        revisionAPI.getDashboard(),
        revisionAPI.getToday({ limit: 5 })
      ]);
      
      if (resDb.data.success) {
        setDbData(resDb.data);
      } else {
        throw new Error('Failed to load dashboard data.');
      }

      if (resQueue.data.success) {
        setQueueData(resQueue.data.items || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load revision dashboard.');
      toast.error('Error fetching dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading revision center...</p>
        </div>
      </div>
    );
  }

  if (error || !dbData) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Dashboard Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not fetch data.'}</p>
          </div>
          <button onClick={fetchDashboard} className="btn-primary text-xs px-4 py-2 mx-auto">
            Retry Load
          </button>
        </div>
      </div>
    );
  }

  const {
    reviseTodayCount = 0,
    overdueCount = 0,
    totalPendingCount = 0,
    masteredCount = 0,
    bookmarkedCount = 0,
    mistakeNotebookCount = 0,
    revisionStreak = 0,
    weakTopics = [],
    recentRevisionActivity = []
  } = dbData;

  // Suggested next action block selection
  let suggestionTitle = 'All Caught Up!';
  let suggestionDesc = 'You have no pending revisions today. Keep practicing or explore your mistakes!';
  let suggestionButtonText = 'Go to Practice';
  let suggestionAction = () => navigate('/aspirant/smart-practice');

  if (overdueCount > 0) {
    suggestionTitle = 'Urgent Revisions Overdue';
    suggestionDesc = `You have ${overdueCount} revision items overdue. Revise them immediately to prevent retention loss.`;
    suggestionButtonText = 'Start Overdue Revisions';
    suggestionAction = () => navigate('/aspirant/revise-today');
  } else if (reviseTodayCount > 0) {
    suggestionTitle = 'Daily Deck Ready';
    suggestionDesc = `You have ${reviseTodayCount} items due for revision today. Spend 15 minutes checking them.`;
    suggestionButtonText = 'Revise Today';
    suggestionAction = () => navigate('/aspirant/revise-today');
  } else if (mistakeNotebookCount > 0) {
    suggestionTitle = 'Review Past Mistakes';
    suggestionDesc = `You have ${mistakeNotebookCount} unreviewed wrong answers in your notebook. Add notes to them.`;
    suggestionButtonText = 'Open Mistake Notebook';
    suggestionAction = () => navigate('/aspirant/mistake-notebook');
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiActivity className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Spaced Repetition System</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Revision Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Build permanent memory through calculated intervals, correct mistakes, and track mastery.
          </p>
        </div>

        {/* Layout Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Sidebar */}
          <RevisionSidebar active="Revision Dashboard" />

          {/* Main Dashboard Space */}
          <div className="flex-1 w-full space-y-6">

            {/* Top Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              
              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-32">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Revise Today</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{reviseTodayCount}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-brand-400 font-bold pt-2">
                  <Link to="/aspirant/revise-today" className="hover:underline flex items-center gap-1">
                    Start Deck <FiArrowRight />
                  </Link>
                  {overdueCount > 0 && (
                    <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-black">
                      {overdueCount} Overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-32">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mistake Notebook</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{mistakeNotebookCount}</p>
                </div>
                <div className="pt-2">
                  <Link to="/aspirant/mistake-notebook" className="text-[10px] text-brand-400 font-bold hover:underline flex items-center gap-1">
                    Open Notebook <FiArrowRight />
                  </Link>
                </div>
              </div>

              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-32">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Bookmarked Questions</p>
                  <p className="text-3xl font-extrabold text-white mt-1">{bookmarkedCount}</p>
                </div>
                <div className="pt-2">
                  <Link to="/aspirant/bookmarks" className="text-[10px] text-brand-400 font-bold hover:underline flex items-center gap-1">
                    View Bookmarks <FiArrowRight />
                  </Link>
                </div>
              </div>

              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-32">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mastered Items</p>
                  <p className="text-3xl font-extrabold text-emerald-400 mt-1">{masteredCount}</p>
                </div>
                <p className="text-[9px] text-slate-500">Scheduled for 30d+ intervals</p>
              </div>

              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-32">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Revision Streak</p>
                  <p className="text-3xl font-extrabold text-amber-400 mt-1">{revisionStreak} <span className="text-xs text-slate-500">Days</span></p>
                </div>
                <p className="text-[9px] text-slate-500">Keep it up to form habit!</p>
              </div>

              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-32">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Mains Practice</p>
                  <p className="text-3xl font-extrabold text-white mt-1">Descriptive</p>
                </div>
                <div className="pt-2">
                  <Link to="/aspirant/answer-writing" className="text-[10px] text-brand-400 font-bold hover:underline flex items-center gap-1">
                    Write Answers <FiArrowRight />
                  </Link>
                </div>
              </div>

            </div>

            {/* Suggested Next Action Hero Block */}
            <div className="bg-gradient-to-r from-brand-600/10 via-dark-900 to-indigo-950/10 border border-brand-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[9px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Recommended Action
                </span>
                <h3 className="text-lg font-bold text-white pt-1">{suggestionTitle}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{suggestionDesc}</p>
              </div>
              <button onClick={suggestionAction} className="btn-primary shrink-0 py-3 px-5 text-xs font-bold shadow-md shadow-brand-500/20">
                {suggestionButtonText}
              </button>
            </div>

            {/* Bottom Content Area: Queue Preview + Weak Topics / Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Left Column: Today's Queue Preview */}
              <div className="lg:col-span-3 bg-dark-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Today's Deck Preview</h4>
                  <Link to="/aspirant/revise-today" className="text-[10px] text-brand-400 font-bold hover:underline">
                    View All Queue
                  </Link>
                </div>

                {queueData.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-xs text-slate-500 italic">No revision items scheduled for today.</p>
                    <p className="text-[10px] text-slate-600">Great job staying ahead! Attempt smart practices to feed your deck.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queueData.map((item, idx) => (
                      <div key={item._id} className="p-3 bg-dark-950/50 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0 space-y-1">
                          <p className="font-semibold text-slate-200 truncate">
                            {item.questionId?.questionText || 'Question item detail'}
                          </p>
                          <div className="flex items-center gap-2 text-[9px] text-slate-500">
                            <span className="font-bold uppercase tracking-wider text-slate-400">
                              {item.subjectId?.title || 'Subject'}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{item.priority} priority</span>
                            {item.sourceType && (() => {
                              const stLabel = item.sourceType === 'official_pyq' || item.sourceType === 'verified_previous_year'
                                ? 'PYQ' : item.sourceType === 'current_affairs' ? 'CA' : null;
                              if (!stLabel) return null;
                              const stCls = stLabel === 'PYQ'
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : 'text-teal-400 bg-teal-500/10 border-teal-500/20';
                              return <span className={`${stCls} border px-1.5 py-0.5 rounded font-bold uppercase`}>{stLabel}</span>;
                            })()}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/aspirant/revision/question/${item._id}`)}
                          className="btn-secondary py-1.5 px-3 text-[10px] font-bold shrink-0"
                        >
                          <FiPlay className="text-[8px]" /> Revise
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Weak Topics + Recent activity */}
              <div className="lg:col-span-2 space-y-6">

                {/* Weak Topics */}
                <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Weak Concepts Preview</h4>
                    <span className="text-[9px] text-rose-450 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/15">
                      Alert
                    </span>
                  </div>

                  {weakTopics.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic py-4 text-center">
                      No weak concepts detected. Maintain accuracy above 50%!
                    </p>
                  ) : (
                    <div className="space-y-3.5">
                      {weakTopics.slice(0, 2).map((wt, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-slate-200 truncate max-w-[70%]">{wt.topicName}</span>
                            <span className="text-rose-450">{wt.accuracy}% acc</span>
                          </div>
                          <p className="text-[9px] text-slate-500 leading-tight">
                            {wt.suggestedAction}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-dark-900/30 border border-slate-800/80 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-850">
                    Recent Revisions
                  </h4>
                  {recentRevisionActivity.length === 0 ? (
                    <p className="text-[10px] text-slate-550 italic py-4 text-center">No recent revision history.</p>
                  ) : (
                    <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                      {recentRevisionActivity.slice(0, 4).map((act, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">
                            {new Date(act.lastRevisedAt).toLocaleDateString()}
                          </span>
                          <span className={`font-bold capitalize ${
                            act.status === 'mastered' ? 'text-emerald-400' : 'text-slate-350'
                          }`}>
                            {act.status} (MS: {act.masteryScore})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
