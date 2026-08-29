import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiClock, FiAward, FiArrowLeft, FiAlertCircle, 
  FiPlay, FiTrash2, FiSliders, FiList 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';
import examAPI from '../../api/examApi.js';

export default function MockTestHistory() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
    fetchAttempts();
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [selectedExamId]);

  const bootstrap = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      const { data } = await mockTestAPI.getMyAttempts(params);
      if (data.success) {
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load mock attempt history.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">Submitted</span>;
      case 'started':
        return <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">In Progress</span>;
      case 'abandoned':
        return <span className="text-[9px] font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full uppercase">Abandoned</span>;
      default:
        return <span className="text-[9px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full uppercase">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Navigation header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/aspirant/mock-tests" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 mb-2 font-bold">
              <FiArrowLeft /> Back to Mock Suite
            </Link>
            <h1 className="text-2xl font-extrabold text-white">Mock Test History</h1>
            <p className="text-slate-500 text-xs mt-0.5">Track your exam attempts, resume started sessions, or review scorecards.</p>
          </div>

          <div className="flex items-center gap-3 self-start shrink-0">
            <span className="text-xs text-slate-500 font-semibold">Filter Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Exams</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
        </div>

        {/* List of attempts */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-550 text-xs font-semibold">Loading attempt logs...</p>
          </div>
        ) : attempts.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-850 space-y-3">
            <FiAlertCircle className="text-3xl text-slate-650 mx-auto" />
            <h3 className="text-white font-bold text-sm">No attempts logged</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">You have not started any mock exam attempts yet. Choose a mock test from the suite to begin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((att) => {
              const isSubmitted = att.status === 'submitted';
              const title = att.mockTestId?.title || 'Simulated Mock Test';
              const questionsCount = att.totalQuestions || att.mockTestId?.totalQuestions || 0;
              const maxMarks = att.totalMarks || att.mockTestId?.totalMarks || 100;
              const duration = att.mockTestId?.durationMinutes || 0;

              return (
                <div 
                  key={att._id}
                  className="glass-card p-5 bg-dark-900/40 border-slate-850 hover:border-slate-800 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                        {att.examId?.title || 'Exam'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-800 border border-slate-750 px-2 py-0.5 rounded-full capitalize">
                        {att.mockTestId?.category?.replace('_', ' ') || 'Mock'}
                      </span>
                      {getStatusBadge(att.status)}
                    </div>

                    <h3 className="text-sm font-extrabold text-white leading-snug">{title}</h3>

                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-semibold flex-wrap">
                      <span className="flex items-center gap-1"><FiClock /> {duration} Mins</span>
                      <span>Questions: {questionsCount}</span>
                      {isSubmitted ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          Score: {att.score} / {maxMarks} ({att.accuracy}% Acc)
                        </span>
                      ) : null}
                      <span className="text-[10px]">
                        Date: {new Date(att.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    {att.status === 'started' || att.status === 'created' ? (
                      <button
                        onClick={() => navigate(`/aspirant/mock-tests/attempt/${att._id}`)}
                        className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1"
                      >
                        <FiPlay /> Resume Attempt
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/aspirant/mock-tests/attempt/${att._id}/result`)}
                        className="btn-secondary py-2 px-4 text-xs font-bold border-slate-800 hover:text-white"
                      >
                        View Scorecard
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
