import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiClock, FiCheckCircle, FiBookOpen, FiArrowRight, 
  FiLoader, FiAlertCircle, FiRefreshCw 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import tutorialAPI from '../../api/tutorialApi.js';

export default function MyLearning() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    continueLearning: [],
    completedTutorials: [],
    subjectStats: [],
  });

  const fetchProgress = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await tutorialAPI.getMyProgress();
      if (res.data?.success) {
        setData(res.data);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch your progress metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const continueList = Array.isArray(data.continueLearning) ? data.continueLearning : [];
  const completedList = Array.isArray(data.completedTutorials) ? data.completedTutorials : [];
  const subjectStats = Array.isArray(data.subjectStats) ? data.subjectStats : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading progress metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border-rose-500/20 p-8 text-center space-y-4">
          <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Progress Failed to Load</h2>
          <p className="text-xs text-slate-450">{error}</p>
          <button
            onClick={fetchProgress}
            className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <FiRefreshCw /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiCheckCircle className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">My Learning Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Learning Progress</h1>
          <p className="text-slate-400 text-sm mt-1">Track your study plan topics completed across competitive syllabuses.</p>
        </div>

        {/* Stats & Subject completion lists */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Progress Columns: list of continues */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Continue Learning */}
            <div className="bg-dark-900/60 border border-slate-800/85 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2 text-sm uppercase tracking-wider">
                <FiClock className="text-brand-400" /> Resume Studying
              </h2>
              {continueList.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic space-y-2">
                  <p>No active topics in progress.</p>
                  <Link to="/aspirant/tutorials" className="btn-secondary py-1.5 px-3 inline-block font-bold">
                    Browse Tutorials
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {continueList.map((item) => (
                    <div key={item._id} className="p-3 bg-dark-950/50 border border-slate-850 rounded-xl flex items-center justify-between gap-4 text-xs">
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-[9px] text-slate-550">
                          <span className="bg-slate-800 px-2 py-0.5 rounded uppercase font-bold text-slate-400">{item.subjectName}</span>
                          <span>•</span>
                          <span>{item.durationMinutes} min read</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-850 h-1.5 rounded-full mt-2">
                          <div 
                            className="bg-brand-500 h-1.5 rounded-full transition-all" 
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      <Link 
                        to={`/aspirant/tutorials/${item.tutorialId}`} 
                        className="btn-primary py-1.5 px-3 text-[10px] font-bold shrink-0 flex items-center gap-1"
                      >
                        Resume
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed list */}
            <div className="bg-dark-900/60 border border-slate-800/85 rounded-2xl p-5 space-y-4">
              <h2 className="font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2 text-sm uppercase tracking-wider">
                <FiCheckCircle className="text-emerald-450" /> Completed Topics
              </h2>
              {completedList.length === 0 ? (
                <p className="py-6 text-center text-slate-550 text-xs italic">No topics completed yet. Finish summaries to lock them in!</p>
              ) : (
                <div className="space-y-3">
                  {completedList.map((item) => (
                    <div key={item._id} className="p-3 bg-dark-950/30 border border-slate-850 rounded-xl flex items-center justify-between gap-4 text-xs font-semibold">
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-slate-300 truncate">{item.title}</p>
                        <p className="text-[9px] text-slate-550">Finished: {new Date(item.completedAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-bold">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: stats breakdown */}
          <div className="bg-dark-900/60 border border-slate-800/85 rounded-2xl p-5 space-y-4">
            <h2 className="font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2 text-sm uppercase tracking-wider">
              <FiBookOpen className="text-brand-400" /> Syllabus Coverage
            </h2>
            {subjectStats.length === 0 ? (
              <p className="text-xs text-slate-550 italic py-4 text-center">Start studying topics to build metrics charts.</p>
            ) : (
              <div className="space-y-4">
                {subjectStats.map((sub, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-350">{sub.subjectName}</span>
                      <span className="text-brand-400">{sub.completionPercent}%</span>
                    </div>
                    {/* Completion bar */}
                    <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-brand-600 to-indigo-500 h-full transition-all" 
                        style={{ width: `${sub.completionPercent}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-550">
                      Completed {sub.completedTopics} of {sub.totalTopics} active topics
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
