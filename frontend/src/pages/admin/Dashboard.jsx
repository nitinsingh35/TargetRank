import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiBookOpen, FiSettings, FiTrendingUp, FiShield, 
  FiActivity, FiEye, FiCheckSquare, FiAlertCircle, FiRefreshCw, FiLoader 
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext.jsx';
import { dashboardAPI } from '../../api/api.js';

const ROLE_BADGE = {
  admin:    'text-rose-400 bg-rose-500/10 border border-rose-500/20',
  mentor:   'text-amber-400 bg-amber-500/10 border border-amber-500/20',
  aspirant: 'text-brand-400 bg-brand-500/10 border border-brand-500/20',
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await dashboardAPI.getAdminStats();
      if (data?.success) {
        setStats(data.dashboard);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to fetch dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalStudents = stats?.totalStudents || 0;
  const totalMentors = stats?.totalMentors || 0;
  const totalQuestions = stats?.totalQuestions || 0;
  const totalMockTests = stats?.totalMockTests || 0;
  const pendingReports = stats?.pendingReports || 0;
  const recentActivity = Array.isArray(stats?.recentActivity) ? stats.recentActivity : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading admin metrics...</p>
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

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiShield className="text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Admin Control Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 text-sm mt-1">Here's what's happening on TargetRank today.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              System Healthy
            </span>
            <Link to="/profile" className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-900 border border-slate-800 transition-all">
              <FiSettings /> Settings
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-650 flex items-center justify-center shadow-lg">
                <FiUsers className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white">{totalStudents}</p>
            <p className="text-xs text-slate-550 mt-0.5">Total Aspirants</p>
          </div>

          <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <FiShield className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white">{totalMentors}</p>
            <p className="text-xs text-slate-550 mt-0.5">Total Mentors</p>
          </div>

          <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <FiBookOpen className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white">{totalQuestions}</p>
            <p className="text-xs text-slate-550 mt-0.5">Total Questions</p>
          </div>

          <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <FiCheckSquare className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-white">{totalMockTests}</p>
            <p className="text-xs text-slate-550 mt-0.5">Mock Test Series</p>
          </div>
        </div>

        {/* Pending Reports Alert */}
        {pendingReports > 0 && (
          <div className="glass-card p-4 border-rose-500/30 bg-rose-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-rose-500 text-xl shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-white">{pendingReports} Pending Question Reports</p>
                <p className="text-slate-400 mt-0.5">Aspirants reported typos or incorrect keys. Review them to keep accuracy high.</p>
              </div>
            </div>
            <Link to="/admin/question-quality" className="btn-secondary text-[11px] font-bold px-3 py-1.5 text-rose-450 border-rose-500/20 hover:bg-rose-500/5">
              Review Now
            </Link>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2"><FiActivity className="text-brand-400" /> Recent Activity Log</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-slate-550 text-xs italic">
              No recent registration or modification logs available.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentActivity.map((act) => (
                <div key={act.id} className="px-6 py-3.5 flex items-center justify-between hover:bg-dark-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold uppercase">
                      {act.type.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-white">{act.message}</p>
                      <p className="text-[10px] text-slate-550">{new Date(act.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <Link to="/admin/exams" className="glass-card p-4 hover:border-brand-500/40 transition-all text-center space-y-1">
            <p className="text-xs font-bold text-white">Syllabus Structure</p>
            <p className="text-[10px] text-slate-550">Manage Exams, Phases, Subjects</p>
          </Link>
          <Link to="/admin/question-import" className="glass-card p-4 hover:border-brand-500/40 transition-all text-center space-y-1">
            <p className="text-xs font-bold text-white">Import Questions</p>
            <p className="text-[10px] text-slate-550">Upload CSV batches</p>
          </Link>
          <Link to="/admin/mock-tests" className="glass-card p-4 hover:border-brand-500/40 transition-all text-center space-y-1">
            <p className="text-xs font-bold text-white">Mock Tests</p>
            <p className="text-[10px] text-slate-550">Create full mock packages</p>
          </Link>
          <Link to="/admin/current-affairs" className="glass-card p-4 hover:border-brand-500/40 transition-all text-center space-y-1">
            <p className="text-xs font-bold text-white">Current Affairs</p>
            <p className="text-[10px] text-slate-550">Draft monthly study cards</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
