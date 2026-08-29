import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiBookOpen, FiStar, FiActivity, FiMessageCircle, 
  FiCalendar, FiAlertCircle, FiRefreshCw, FiLoader, FiSettings 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { dashboardAPI } from '../../api/api.js';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await dashboardAPI.getMentorStats();
      if (data?.success) {
        setStats(data.dashboard);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch mentor dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const assignedStudents = stats?.assignedStudents || 0;
  const pendingAnswerReviews = stats?.pendingAnswerReviews || 0;
  const recentSubmissions = Array.isArray(stats?.recentSubmissions) ? stats.recentSubmissions : [];
  const upcomingTasks = Array.isArray(stats?.upcomingTasks) ? stats.upcomingTasks : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading mentor workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border-rose-500/20 p-8 text-center space-y-4">
          <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Workspace Failed to Load</h2>
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

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiStar className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Mentor Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Hello, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 text-sm mt-1">
              {pendingAnswerReviews > 0 
                ? `You have ${pendingAnswerReviews} student copies waiting for reviews.` 
                : 'Your feedback queue is clean today!'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 self-start">
            <Link to="/mentor/syllabus" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 transition-all font-semibold">
              <FiBookOpen /> Syllabus Reference
            </Link>
            <Link to="/mentor/questions" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-dark-900 border border-slate-800 transition-all font-semibold">
              <FiSettings /> Question Vault
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shrink-0">
              <FiUsers className="text-white text-xl" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{assignedStudents}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assigned Students</p>
            </div>
          </div>

          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-650 flex items-center justify-center shadow-lg shrink-0">
              <FiMessageCircle className="text-white text-xl" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{pendingAnswerReviews}</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pending Reviews</p>
            </div>
          </div>

          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
              <FiBookOpen className="text-white text-xl" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">Active</p>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Evaluation Mode</p>
            </div>
          </div>
        </div>

        {/* Student Submissions */}
        <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="font-bold text-white flex items-center gap-2"><FiActivity className="text-amber-400" /> Recent Answer Submissions</h2>
            <Link to="/mentor/questions" className="text-xs text-slate-400 hover:text-white transition-colors font-semibold">View All Questions</Link>
          </div>
          {recentSubmissions.length === 0 ? (
            <div className="p-8 text-center text-slate-550 text-xs italic">
              No recent student answer copies submitted to evaluate.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentSubmissions.map((sub) => (
                <div key={sub._id} className="px-6 py-4 flex items-center justify-between hover:bg-dark-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                      {sub.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{sub.studentName}</p>
                      <p className="text-xs text-slate-500">{sub.questionTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] bg-slate-800/60 px-2 py-0.5 rounded text-slate-450 uppercase font-black tracking-wider">
                      {sub.status.replace('_', ' ')}
                    </span>
                    <Link 
                      to={`/mentor/answer-submissions?id=${sub._id}`} 
                      className="text-xs text-slate-300 hover:text-white bg-dark-800 hover:bg-dark-700 px-3 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1 font-semibold"
                    >
                      Evaluate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks list */}
        <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-6">
          <h2 className="font-bold text-white flex items-center gap-2 mb-4"><FiCalendar className="text-brand-400" /> Assigned Evaluation Checklist</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No tasks listed.</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-3 bg-dark-950/40 border border-slate-850 rounded-xl text-xs font-semibold">
                  <span className="text-slate-200">{t.title}</span>
                  <span className="text-slate-550">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
