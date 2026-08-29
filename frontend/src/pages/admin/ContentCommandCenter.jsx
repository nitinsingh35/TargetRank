import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiFolder, FiUpload, FiCpu, FiTrendingUp, FiCheckCircle, FiFileText, FiAlertCircle, FiSettings } from 'react-icons/fi';
import toast from 'react-hot-toast';
import contentAPI from '../../api/contentApi.js';
import generationAPI from '../../api/generationApi.js';

export default function ContentCommandCenter() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    pendingReview: 0,
    coverageTargetsCount: 0,
    reportedCount: 0,
  });
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [queueRes, coverageRes, batchesRes] = await Promise.all([
          contentAPI.getReviewQueue(),
          contentAPI.getContentCoverage(),
          generationAPI.getBatches(),
        ]);

        setStats({
          pendingReview: queueRes.data.length,
          coverageTargetsCount: coverageRes.data.length,
          totalQuestions: queueRes.data.length + coverageRes.data.reduce((acc, c) => acc + c.publishedCount, 0),
          reportedCount: 0, // placeholder
        });
        setBatches(batchesRes.data.slice(0, 5));
      } catch (err) {
        toast.error('Failed to load command center statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiSettings className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Platform Content Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Content Command Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">Control uploads, trigger practice question generators, and moderate syllabus databases.</p>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-5 bg-dark-900 border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Questions</p>
            <p className="text-2xl font-extrabold text-white">{stats.totalQuestions}</p>
          </div>
          <div className="glass-card p-5 bg-dark-900 border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <p className="text-2xl font-extrabold text-amber-400">{stats.pendingReview}</p>
          </div>
          <div className="glass-card p-5 bg-dark-900 border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coverage Targets</p>
            <p className="text-2xl font-extrabold text-brand-400">{stats.coverageTargetsCount}</p>
          </div>
          <div className="glass-card p-5 bg-dark-900 border-slate-800 space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reported Bugs</p>
            <p className="text-2xl font-extrabold text-rose-400">{stats.reportedCount}</p>
          </div>
        </div>

        {/* Operations Navigation Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/question-import" className="glass-card p-5 bg-dark-900/40 hover:bg-dark-900 border-slate-800/80 hover:border-brand-500/45 transition-all text-left block space-y-2">
            <FiUpload className="text-brand-400 text-lg" />
            <h3 className="text-sm font-bold text-white">Bulk Data Import</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Import questions in CSV and JSON formats in chunks of 500 rows.</p>
          </Link>

          <Link to="/admin/question-quality" className="glass-card p-5 bg-dark-900/40 hover:bg-dark-900 border-slate-800/80 hover:border-brand-500/45 transition-all text-left block space-y-2">
            <FiCheckCircle className="text-emerald-400 text-lg" />
            <h3 className="text-sm font-bold text-white">Quality Review</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Approve practice generators or reject duplicate submissions.</p>
          </Link>

          <Link to="/admin/content-coverage" className="glass-card p-5 bg-dark-900/40 hover:bg-dark-900 border-slate-800/80 hover:border-brand-500/45 transition-all text-left block space-y-2">
            <FiTrendingUp className="text-indigo-400 text-lg" />
            <h3 className="text-sm font-bold text-white">Coverage targets</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Check topic-wise targets and list missing-content gap warnings.</p>
          </Link>

          <Link to="/mentor/question-generator" className="glass-card p-5 bg-dark-900/40 hover:bg-dark-900 border-slate-800/80 hover:border-brand-500/45 transition-all text-left block space-y-2">
            <FiCpu className="text-amber-400 text-lg" />
            <h3 className="text-sm font-bold text-white">Question Generator</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Trigger background polity, quant, or reasoning question generators.</p>
          </Link>
        </div>

        {/* Generator jobs logging */}
        <div className="glass-card p-6 bg-dark-900 border-slate-850/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FiFileText className="text-brand-400" /> Recent Generator Batches
          </h3>

          {batches.length === 0 ? (
            <p className="text-slate-500 text-xs py-2">No background generation batches created yet.</p>
          ) : (
            <div className="divide-y divide-slate-850">
              {batches.map((b) => (
                <div key={b._id} className="py-3 flex justify-between items-center text-xs flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-slate-200">{b.batchName}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Uploaded: {new Date(b.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 font-semibold">Imported: {b.importedRows}/{b.totalRows}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      b.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      b.status === 'failed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {b.status}
                    </span>
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
