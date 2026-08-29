import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiBarChart2, FiUsers, FiCheckCircle,
  FiTrendingUp, FiClock, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';
import AdminSidebar from './AdminSidebar.jsx';

export default function CurrentAffairsPackAnalytics() {
  const { id } = useParams();
  const [pack, setPack] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [packRes, analyticsRes] = await Promise.all([
        currentAffairsAPI.adminGetPack(id),
        currentAffairsAPI.adminGetPackAnalytics(id)
      ]);
      setPack(packRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      toast.error('Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val, dec = 1) =>
    val === undefined || val === null ? '—' : Number(val).toFixed(dec);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBarChart2 className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Analytics</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {pack ? pack.title : 'Current Affairs Analytics'}
            </h1>
            {pack && (
              <p className="text-slate-500 text-sm mt-0.5">
                {new Date(0, pack.month - 1).toLocaleString('en', { month: 'long' })} {pack.year} · {pack.language}
              </p>
            )}
          </div>
          <Link
            to="/admin/current-affairs"
            className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-slate-700 hover:bg-dark-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            <FiArrowLeft /> Back
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar active="Current Affairs" />

          {/* Main Area */}
          <div className="flex-1 space-y-6">

            {!analytics || analytics.totalAttempts === 0 ? (
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <FiUsers className="text-4xl text-slate-700 mx-auto mb-3" />
                <p className="font-semibold text-slate-400">No attempts yet</p>
                <p className="text-xs text-slate-600 mt-1">Real attempts data will show up once aspirants start practicing this pack.</p>
              </div>
            ) : (
              <>
                {/* Summary Row */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    [FiUsers, 'Attempts', analytics.totalAttempts, 'text-blue-400'],
                    [FiCheckCircle, 'Comp. Rate', `${fmt(analytics.completionRate)}%`, 'text-emerald-400'],
                    [FiTrendingUp, 'Avg Score', fmt(analytics.avgScore), 'text-amber-400'],
                    [FiTrendingUp, 'Avg Accuracy', `${fmt(analytics.avgAccuracy)}%`, 'text-indigo-400'],
                    [FiClock, 'Avg Time', `${analytics.avgTimeTaken || 0} min`, 'text-slate-300']
                  ].map(([Icon, label, val, color], idx) => (
                    <div key={idx} className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
                      <Icon className={`text-xl mx-auto mb-2 ${color}`} />
                      <p className={`text-2xl font-black ${color}`}>{val}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-wider">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Category Performance */}
                {analytics.categoryPerformance?.length > 0 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-white">Performance by Category</h3>
                    <div className="space-y-3">
                      {analytics.categoryPerformance.map(cat => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold truncate capitalize">{cat.category.replace('_', ' ')}</span>
                            <span className="text-slate-400">{fmt(cat.accuracy)}% accuracy ({cat.totalQuestions} questions)</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-750 ${
                                cat.accuracy >= 60 ? 'bg-emerald-500' : cat.accuracy >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${cat.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Difficult Categories */}
                {analytics.difficultCategories?.length > 0 && (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 text-rose-400">
                      <FiAlertCircle /> Difficult Sectors (Accuracy &lt; 50%)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analytics.difficultCategories.map(cat => (
                        <span key={cat.category} className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl capitalize">
                          {cat.category.replace('_', ' ')}: {fmt(cat.accuracy)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
