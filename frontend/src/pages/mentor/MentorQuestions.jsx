import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiHelpCircle, FiEdit2, FiCheck, FiX, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import questionAPI from '../../api/questionApi.js';

export default function MentorQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuthoredQuestions = async () => {
    try {
      const { data } = await questionAPI.getQuestions({ limit: 100 });
      setQuestions(data.questions);
    } catch (err) {
      toast.error('Failed to load authored questions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthoredQuestions();
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
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">My Authored Questions</h1>
            <p className="text-slate-500 text-xs mt-0.5">Submit practice questions for admin approval and review.</p>
          </div>
          <Link
            to="/mentor/questions/create"
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 self-start"
          >
            <FiPlus /> Author Question
          </Link>
        </div>

        {/* Authored list */}
        {questions.length === 0 ? (
          <div className="glass-card p-16 text-center border-slate-850">
            <FiHelpCircle className="text-4xl text-slate-650 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-2">No authored questions found</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mb-4">
              Write manual questions or use template layouts to contribute to the global database.
            </p>
            <Link to="/mentor/questions/create" className="btn-primary py-2 px-4 text-xs font-semibold inline-block">
              Write Your First Question
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q._id} className="glass-card p-6 bg-dark-900 border-slate-800 space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-850 border border-slate-800 px-2 py-0.5 rounded-full">
                      {q.category}
                    </span>
                    {q.year && (
                      <span className="text-[9px] font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-full">
                        PYQ {q.year}
                      </span>
                    )}
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    q.status === 'published' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                    q.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {q.status === 'published' ? 'Published' : q.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((option, oidx) => {
                    const isCorrect = option === q.correctAnswer;
                    return (
                      <div
                        key={oidx}
                        className={`px-4 py-2 border rounded-lg text-xs font-medium flex items-center justify-between ${
                          isCorrect
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                            : 'border-slate-850 bg-dark-950 text-slate-500'
                        }`}
                      >
                        <span>{option}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
