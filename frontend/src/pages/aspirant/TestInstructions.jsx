import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertTriangle, FiClock, FiFileText, FiAward, FiBook } from 'react-icons/fi';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';

export default function TestInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data } = await testAPI.getMockTestById(id);
        setTest(data);
      } catch (err) {
        toast.error('Failed to load instructions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleStartExam = async () => {
    setStarting(true);
    toast.loading('Loading randomized exam sheet...', { id: 'exam-start-toast' });
    try {
      const { data } = await testAPI.startAttempt(id);
      toast.success('Exam started! Good luck!', { id: 'exam-start-toast' });
      // Navigate to attempts workspace
      navigate(`/aspirant/mock-tests/${id}/attempt`, {
        state: {
          attemptId: data.attemptId,
          questions: data.questions,
          durationMinutes: data.durationMinutes
        }
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start attempt.';
      toast.error(msg, { id: 'exam-start-toast' });
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Test template not found</h2>
          <Link to="/aspirant/mock-tests" className="text-brand-400 hover:underline flex items-center justify-center gap-1.5">
            <FiArrowLeft /> Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Back navigation */}
        <Link
          to="/aspirant/mock-tests"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Mock Tests
        </Link>

        {/* Overview Header */}
        <div className="glass-card p-8 bg-dark-900 border-slate-800 flex justify-between items-start gap-4 flex-wrap">
          <div className="space-y-2 max-w-lg">
            <span className="text-[10px] font-bold text-slate-400 bg-slate-850 border border-slate-800 px-3 py-1 rounded-full uppercase">
              {test.examId?.title || 'Competitive Exam'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{test.title}</h1>
          </div>

          <div className="flex gap-6 text-center text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Time Limit</p>
              <p className="text-base font-extrabold text-brand-400 mt-1 flex items-center gap-1"><FiClock /> {test.durationMinutes}m</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Questions</p>
              <p className="text-base font-extrabold text-slate-300 mt-1">{test.questions?.length || 0}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Marks</p>
              <p className="text-base font-extrabold text-slate-300 mt-1">{test.totalMarks}</p>
            </div>
          </div>
        </div>

        {/* General instructions card */}
        <div className="glass-card p-8 bg-dark-900 border-slate-800 space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <FiFileText className="text-brand-400" /> General Instructions
          </h3>

          <div className="space-y-4 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
            {test.instructions || `1. Read each question carefully before attempting.\n2. Ensure you have a stable internet connection.\n3. Do not close or refresh the exam tab.`}
          </div>

          {/* Negative marking callout */}
          {test.negativeMarkingEnabled && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 text-xs">
              <FiAlertTriangle className="text-rose-400 shrink-0 text-base mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-300">Negative Marking Active</h4>
                <p className="text-slate-400 mt-1">
                  Each incorrect answer will attract a penalty of <strong className="text-rose-400">{test.negativeMarkingValue * 100}%</strong> of the question's allotted marks. Unanswered questions attract 0 deduction.
                </p>
              </div>
            </div>
          )}

          {/* Action confirmation panel */}
          <div className="pt-6 border-t border-slate-850 flex justify-end gap-3">
            <Link
              to="/aspirant/mock-tests"
              className="bg-dark-800 hover:bg-dark-750 text-slate-400 font-semibold px-5 py-2.5 rounded-xl text-xs transition-all"
            >
              Cancel
            </Link>
            <button
              onClick={handleStartExam}
              disabled={starting}
              className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-1.5"
            >
              Start Exam Series <FiBook />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
