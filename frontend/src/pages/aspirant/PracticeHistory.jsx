import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiClock, FiCheckSquare, FiPlay, FiAward, FiTrash2, 
  FiSliders, FiArrowLeft, FiLoader, FiAlertCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import practiceAPI from '../../api/practiceApi.js';

export default function PracticeHistory() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  useEffect(() => {
    fetchSessions(pagination.page);
  }, [pagination.page]);

  const fetchSessions = async (pageNumber) => {
    setLoading(true);
    try {
      const { data } = await practiceAPI.getMySessions(pageNumber, 10);
      if (data.success) {
        setSessions(data.sessions || []);
        setPagination(data.pagination || { page: pageNumber, limit: 10, total: 0, pages: 1 });
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load practice history.');
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this practice session?')) return;
    
    try {
      await practiceAPI.deleteSession(sessionId);
      toast.success('Session deleted.');
      fetchSessions(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete session.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'created':
        return (
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
            Ready to Start
          </span>
        );
      case 'started':
        return (
          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            In Progress
          </span>
        );
      case 'submitted':
        return (
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Submitted
          </span>
        );
      case 'abandoned':
        return (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
            Abandoned
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            Closed
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/aspirant/smart-practice" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mb-2 font-bold">
              <FiArrowLeft /> Back to Setup
            </Link>
            <h1 className="text-2xl font-extrabold text-white">Practice History</h1>
            <p className="text-slate-500 text-xs mt-0.5">Resume started sessions, view scorecard results, or clean up setups.</p>
          </div>
          <Link
            to="/aspirant/smart-practice"
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 self-start"
          >
            <FiSliders /> Create Smart Practice
          </Link>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <FiLoader className="text-2xl text-brand-500 animate-spin" />
              <span className="text-slate-500 text-xs font-bold">Fetching sessions...</span>
            </div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-850">
            <FiAlertCircle className="text-3xl text-slate-650 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-white">No practice sessions found</h3>
            <p className="text-slate-500 text-xs mt-1">Configure your first smart practice session to begin training.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((s) => {
                const hasScore = s.status === 'submitted' && s.resultGenerated;
                
                return (
                  <div key={s._id} className="glass-card p-5 bg-dark-900/40 border-slate-800 hover:border-slate-750 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                          {s.examId?.title || 'Exam'}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full font-bold">
                          {s.mode?.replace('_', ' ')}
                        </span>
                        {getStatusBadge(s.status)}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold flex-wrap">
                        <span className="flex items-center gap-1">
                          <FiClock /> {s.durationMinutes} mins
                        </span>
                        
                        {s.selectionSummary ? (
                          <>
                            <span className="flex items-center gap-1">
                              <span>Questions: {s.selectionSummary.selectedCount} / {s.selectionSummary.requestedCount}</span>
                              {s.selectionSummary.selectedCount < s.selectionSummary.requestedCount && (
                                <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded ml-1" title="Fewer questions were generated than requested due to pool limit.">
                                  SHORTAGE WARNING
                                </span>
                              )}
                            </span>
                            {s.selectionSummary.sourceDistribution && (
                              <span className="text-slate-500 text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                {Object.entries(s.selectionSummary.sourceDistribution)
                                  .map(([src, count]) => `${count} ${src.replace('official_pyq', 'PYQ').replace('original_practice', 'Original').replace('verified_previous_year', 'PYQ')}`)
                                  .join(', ')}
                              </span>
                            )}
                            {s.selectionSummary.reusedRecentQuestionCount > 0 && (
                              <span className="text-[10px] text-slate-550 font-normal">
                                • Reused {s.selectionSummary.reusedRecentQuestionCount} recent Qs
                              </span>
                            )}
                          </>
                        ) : (
                          <span>
                            {s.generatedQuestionCount || s.requestedQuestionCount} Questions
                          </span>
                        )}

                        {hasScore && (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <FiAward /> Score: {s.score} / {s.totalMarks} ({s.accuracy}% Acc)
                          </span>
                        )}
                        <span className="text-[10px]">
                          Created: {new Date(s.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {s.status === 'created' && (
                        <button
                          onClick={() => navigate(`/aspirant/practice-session/${s._id}`)}
                          className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <FiPlay className="text-xs" /> Start Practice
                        </button>
                      )}
                      
                      {s.status === 'started' && (
                        <button
                          onClick={() => navigate(`/aspirant/practice-session/${s._id}`)}
                          className="btn-primary py-2 px-4 text-xs font-bold bg-amber-600 hover:bg-amber-500 flex items-center gap-1 shadow-sm"
                        >
                          <FiPlay className="text-xs" /> Resume Practice
                        </button>
                      )}

                      {s.status === 'submitted' && (
                        <button
                          onClick={() => navigate(`/aspirant/practice-session/${s._id}/result`)}
                          className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-1 border-slate-700 text-slate-300"
                        >
                          View Result
                        </button>
                      )}

                      {/* Deletable if created or abandoned */}
                      {['created', 'abandoned'].includes(s.status) && (
                        <button
                          onClick={() => handleDeleteSession(s._id)}
                          className="p-2 bg-dark-950 border border-slate-800 hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-all rounded-lg"
                          title="Delete session setup"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-1.5 pt-2">
                {Array.from({ length: pagination.pages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      pagination.page === idx + 1
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
