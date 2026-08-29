import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiAward, FiCheck, FiX, FiClock, FiPercent, FiArrowRight, FiBookOpen, FiFileText } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';

export default function TestResult() {
  const { id: attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const { data } = await testAPI.getAttemptResult(attemptId);
        setResult(data);
      } catch (err) {
        toast.error('Failed to load attempt result.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Result records not found</h2>
          <Link to="/aspirant/mock-tests" className="text-brand-400 hover:underline">Back to Mock Tests</Link>
        </div>
      </div>
    );
  }

  const { attempt, questions = [], subjectPerformance = [], topicPerformance = [] } = result;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FiAward className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Exam Scorecard</h1>
            <p className="text-slate-500 text-xs mt-0.5">Performance summary for: <strong className="text-brand-400">{attempt.mockTestId?.title || 'Practice Set'}</strong></p>
          </div>
        </div>

        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Score card */}
          <div className="glass-card p-5 bg-dark-900 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Final Score</p>
            <p className="text-2xl font-extrabold text-white">{attempt.score} <span className="text-xs text-slate-500">Marks</span></p>
          </div>

          {/* Accuracy card */}
          <div className="glass-card p-5 bg-dark-900 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Accuracy</p>
            <p className="text-2xl font-extrabold text-brand-400 flex items-center justify-center gap-1"><FiPercent className="text-xs" /> {attempt.accuracy}%</p>
          </div>

          {/* Time Taken */}
          <div className="glass-card p-5 bg-dark-900 border-slate-800 text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Time Taken</p>
            <p className="text-2xl font-extrabold text-slate-300 flex items-center justify-center gap-1.5"><FiClock className="text-sm" /> {formatDuration(attempt.timeTakenSeconds)}</p>
          </div>

          {/* Correct / Wrong / Unanswered */}
          <div className="glass-card p-5 bg-dark-900 border-slate-800 flex justify-around items-center text-center">
            <div>
              <p className="text-emerald-400 text-base font-bold">{attempt.correctCount}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Correct</p>
            </div>
            <div className="border-l border-slate-800 h-8"></div>
            <div>
              <p className="text-rose-400 text-base font-bold">{attempt.incorrectCount}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Wrong</p>
            </div>
            <div className="border-l border-slate-800 h-8"></div>
            <div>
              <p className="text-slate-400 text-base font-bold">{attempt.unansweredCount}</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Skipped</p>
            </div>
          </div>
        </div>

        {/* Recharts Analytics Charts grid */}
        {subjectPerformance.length > 0 && (
          <div className="glass-card p-6 bg-dark-900 border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
              <FiFileText className="text-brand-400" /> Subject-wise Score Breakdown
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '11px' }} />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} name="Score Obtained" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Solutions Review Panel */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FiBookOpen className="text-brand-400" /> Question & Answer Key Review
          </h3>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const qid = q._id.toString();
              const userAns = attempt.answers.get(qid);
              const isCorrect = userAns === q.correctAnswer;
              const isUnattempted = !userAns;

              let cardStyle = 'border-slate-800';
              let badge = null;

              if (isCorrect) {
                cardStyle = 'border-emerald-500/20 bg-emerald-500/5';
                badge = <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">CORRECT</span>;
              } else if (isUnattempted) {
                cardStyle = 'border-slate-800 bg-dark-900/40';
                badge = <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">SKIPPED</span>;
              } else {
                cardStyle = 'border-rose-500/20 bg-rose-500/5';
                badge = <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full font-bold">WRONG</span>;
              }

              return (
                <div key={qid} className={`glass-card p-6 border transition-all ${cardStyle}`}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-500">QUESTION {idx + 1}</span>
                    {badge}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold mb-4 whitespace-pre-line">
                    {q.questionText}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {q.options.map((opt, oidx) => {
                      const correct = opt === q.correctAnswer;
                      const selected = opt === userAns;
                      let optionStyle = 'border-slate-850 bg-dark-950 text-slate-500';
                      if (correct) {
                        optionStyle = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold';
                      } else if (selected) {
                        optionStyle = 'border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold';
                      }
                      return (
                        <div key={oidx} className={`px-4 py-2 border rounded-lg text-xs flex justify-between items-center ${optionStyle}`}>
                          <span>{opt}</span>
                          {correct && <FiCheck className="text-emerald-400 text-sm shrink-0" />}
                          {!correct && selected && <FiX className="text-rose-400 text-sm shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-4 bg-dark-950 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                      <strong className="text-slate-300 font-bold block mb-1">Explanation:</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Back control */}
        <div className="text-center pt-4">
          <Link
            to="/aspirant/mock-tests"
            className="btn-secondary py-2.5 px-6 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            Practice Another Mock Test <FiArrowRight />
          </Link>
        </div>

      </div>
    </div>
  );
}
