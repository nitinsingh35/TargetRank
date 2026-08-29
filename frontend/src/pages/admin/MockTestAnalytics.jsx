import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiBarChart2, FiUsers, FiCheckSquare, 
  FiClock, FiPercent, FiAward, FiAlertCircle, FiDownload 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';

export default function MockTestAnalytics() {
  const { id } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [mockTest, setMockTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, detailsRes] = await Promise.all([
        mockTestAPI.adminGetAnalytics(id),
        mockTestAPI.adminGetMockTest(id)
      ]);

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.analytics);
      }
      if (detailsRes.data.success) {
        setMockTest(detailsRes.data.mockTest);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load test attempt analytics.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60);
    const r = Math.round(secs % 60);
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  };

  const handleExportCSVPlaceholder = () => {
    toast.success('Analytics CSV export triggered (Placeholder - downloaded to server files).');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!analytics || !mockTest) {
    return (
      <div className="min-h-screen bg-[#030712] py-8 px-4 flex items-center justify-center">
        <div className="glass-card max-w-md p-6 text-center space-y-4 border-slate-800">
          <FiAlertCircle className="text-3xl text-rose-500 mx-auto animate-bounce" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Analytics Data Unavailable</h3>
          <p className="text-slate-500 text-xs leading-normal">
            We could not pull analytics data for this simulated mock test series. Please make sure the test ID is correct.
          </p>
          <Link to="/admin/mock-tests" className="btn-secondary py-2 px-4 text-xs font-bold border-slate-800 inline-block">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Back and export */}
        <div className="flex justify-between items-center gap-4">
          <Link to="/admin/mock-tests" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-bold">
            <FiArrowLeft /> Back to Catalog
          </Link>
          <button
            onClick={handleExportCSVPlaceholder}
            className="btn-secondary py-2 px-4 text-xs font-bold border-slate-800 flex items-center gap-1.5"
          >
            <FiDownload /> Export CSV Report
          </button>
        </div>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FiBarChart2 className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Cohort Attempt Analytics</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Review details for: <strong className="text-slate-350">{mockTest.title}</strong>
            </p>
          </div>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total attempts */}
          <div className="glass-card p-4 bg-dark-900/40 border-slate-850 text-center space-y-1">
            <FiUsers className="text-brand-400 mx-auto text-lg" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Total Attempts</p>
            <p className="text-xl font-extrabold text-white">{analytics.totalAttempts}</p>
          </div>

          {/* Completion rate */}
          <div className="glass-card p-4 bg-dark-900/40 border-slate-850 text-center space-y-1">
            <FiCheckSquare className="text-emerald-400 mx-auto text-lg" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Completion Rate</p>
            <p className="text-xl font-extrabold text-white">{analytics.completionRate}%</p>
          </div>

          {/* Average Score */}
          <div className="glass-card p-4 bg-dark-900/40 border-slate-850 text-center space-y-1">
            <FiAward className="text-amber-400 mx-auto text-lg" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Average Score</p>
            <p className="text-xl font-extrabold text-white">
              {analytics.averageScore} <span className="text-[10px] text-slate-500 font-bold">/ {mockTest.totalMarks}</span>
            </p>
          </div>

          {/* Average Accuracy */}
          <div className="glass-card p-4 bg-dark-900/40 border-slate-850 text-center space-y-1">
            <FiPercent className="text-sky-400 mx-auto text-lg" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avg Accuracy</p>
            <p className="text-xl font-extrabold text-white">{analytics.averageAccuracy}%</p>
          </div>

          {/* Average Time taken */}
          <div className="glass-card p-4 bg-dark-900/40 border-slate-850 text-center space-y-1 col-span-2 lg:col-span-1">
            <FiClock className="text-rose-400 mx-auto text-lg" />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Avg Time Spent</p>
            <p className="text-base font-extrabold text-white truncate">{formatDuration(analytics.averageTimeSeconds)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Most Incorrect Topics list */}
          <div className="glass-card bg-dark-900/30 border-slate-850 p-6 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Most Incorrect Concept Topics</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Top syllabus areas where students had low scores (accuracy &lt; 50%).</p>
            </div>

            {analytics.weakTopics.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No topic performance errors registered yet.</p>
            ) : (
              <div className="space-y-2">
                {analytics.weakTopics.map((top, idx) => (
                  <div key={idx} className="p-3 bg-dark-950/80 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{top.name}</span>
                    <span className="text-[10px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                      {top.count} Student Misses
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Most Bookmarked questions */}
          <div className="glass-card bg-dark-900/30 border-slate-850 p-6 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Most Bookmarked Questions</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Questions students frequently save to their folders for standard review.</p>
            </div>

            {analytics.bookmarkedQuestions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No bookmarked questions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {analytics.bookmarkedQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-dark-950/80 border border-slate-850 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-bold text-slate-200 line-clamp-1 flex-1">{q.questionText}</p>
                      <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                        {q.bookmarksCount} Saves
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Subject: {q.subject} · Topic: {q.topic}
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
