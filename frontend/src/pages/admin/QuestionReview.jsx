import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX, FiClock, FiHelpCircle, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import contentAPI from '../../api/contentApi.js';

export default function QuestionReview() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const { data } = await contentAPI.getReviewQueue();
      setQueue(data);
    } catch (err) {
      toast.error('Failed to load review queue.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (id) => {
    try {
      await contentAPI.reviewQuestion(id, { status: 'published' });
      toast.success('Question published successfully!');
      fetchQueue();
    } catch (err) {
      toast.error('Failed to publish question.');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter comment or rejection reason:');
    if (reason === null) return; // cancelled

    try {
      await contentAPI.reviewQuestion(id, { status: 'rejected', reviewComment: reason });
      toast.success('Question rejected.');
      fetchQueue();
    } catch (err) {
      toast.error('Failed to reject question.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/admin/content-command-center"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Command Center
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Question Review Queue</h1>
          <p className="text-slate-500 text-xs mt-0.5">Approve mentor-created and practice-generated questions before they are published to aspirants.</p>
        </div>

        {/* Queue List */}
        {queue.length === 0 ? (
          <div className="glass-card p-16 text-center border-slate-850">
            <FiHelpCircle className="text-4xl text-slate-650 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Review queue is empty</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">
              All question uploads and generation jobs have been moderated successfully.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((q) => (
              <div key={q._id} className="glass-card p-6 bg-dark-900 border-slate-800 space-y-4">
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-full uppercase">
                      {q.sourceType.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full uppercase">
                      {q.examId?.title || 'Competitive Exam'}
                    </span>
                    <span className="font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-full">
                      {q.difficulty.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(q._id)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(q._id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                  {q.questionText}
                </p>

                {/* Option list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oidx) => {
                    const isCorrect = opt === q.correctAnswer;
                    return (
                      <div
                        key={oidx}
                        className={`px-4 py-2.5 border rounded-lg text-xs font-semibold flex justify-between items-center ${
                          isCorrect ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-850 bg-dark-950 text-slate-500'
                        }`}
                      >
                        <span>{opt}</span>
                        {isCorrect && <FiCheck className="text-sm shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-4 bg-dark-950 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                    <strong className="text-slate-300 font-bold block mb-1">Explanation:</strong>
                    {q.explanation}
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-slate-850/60">
                  <span>Author: {q.createdBy?.name || 'Platform System'}</span>
                  <span>Marks: {q.marks} | Neg: {q.negativeMarks}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
