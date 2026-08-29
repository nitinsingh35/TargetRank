import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiAward, FiCheckCircle, FiXCircle, FiMinus, FiBarChart2,
  FiArrowLeft, FiBookmark, FiClock, FiTrendingUp, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';

function ProgressRing({ pct, size = 100, stroke = 8, color = '#f59e0b' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
    </svg>
  );
}

function ResultSection({ title, questions = [], responses, correctAnswers }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-dark-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-dark-800/40 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <h3 className="text-sm font-bold text-white">{title} <span className="text-slate-500">({questions.length} questions)</span></h3>
        {open ? <FiChevronUp className="text-slate-500" /> : <FiChevronDown className="text-slate-500" />}
      </button>
      {open && (
        <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
          {questions.map((q, idx) => {
            const res = responses.find(r => r.questionId?.toString() === q._id?.toString());
            const selected = res?.selectedOption;
            const correct = correctAnswers[q._id?.toString()];
            const isCorrect = selected && selected === correct;
            const isWrong = selected && selected !== correct;
            const isSkipped = !selected;
            return (
              <div key={q._id} className={`p-5 space-y-3 ${isCorrect ? 'bg-emerald-500/3' : isWrong ? 'bg-rose-500/3' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isCorrect ? 'bg-emerald-500/15 text-emerald-400' :
                    isWrong ? 'bg-rose-500/15 text-rose-400' :
                    'bg-slate-800 text-slate-500'
                  }`}>
                    {isCorrect ? <FiCheckCircle className="text-xs" /> :
                     isWrong ? <FiXCircle className="text-xs" /> :
                     <FiMinus className="text-xs" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-relaxed">{q.questionText}</p>
                    {q.questionImage && (
                      <img src={q.questionImage} alt="" className="mt-2 max-h-40 rounded-lg border border-slate-700 object-contain" />
                    )}
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 gap-1.5 ml-9">
                  {(q.options || []).map((opt, oi) => {
                    const key = String.fromCharCode(65 + oi);
                    const optText = typeof opt === 'object' ? opt.text : opt;
                    const isCorrectOpt = key === correct;
                    const isSelectedOpt = key === selected;
                    return (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                          isCorrectOpt ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                          isSelectedOpt && isWrong ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                          'text-slate-500'
                        }`}
                      >
                        <span className="font-bold shrink-0">{key}.</span> {optText}
                        {isCorrectOpt && <span className="ml-auto text-emerald-400 font-semibold">✓ Correct</span>}
                        {isSelectedOpt && isWrong && <span className="ml-auto text-rose-400 font-semibold">✗ Your Answer</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="ml-9 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <p className="text-[11px] text-blue-400 font-semibold mb-1">Explanation</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{q.explanation}</p>
                  </div>
                )}

                {/* Marks */}
                <div className="ml-9 flex items-center gap-3 text-xs">
                  {isCorrect && <span className="text-emerald-400 font-bold">+{q.marks} marks</span>}
                  {isWrong && q.negativeMarks > 0 && <span className="text-rose-400 font-bold">–{q.negativeMarks} marks</span>}
                  {isSkipped && <span className="text-slate-500">Skipped</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PYQPaperResult() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResult();
  }, [attemptId]);

  const loadResult = async () => {
    setLoading(true);
    try {
      const { data } = await pyqAPI.getResult(attemptId);
      setResult(data);
    } catch (err) {
      toast.error('Failed to load result.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Result not found.</p>
        <Link to="/aspirant/pyq-papers" className="text-amber-400 text-sm">← Back to PYQ Papers</Link>
      </div>
    );
  }

  const { attempt, paper, questions, correctAnswers = {}, subjectWise = [], comparison } = result;
  const scorePercent = Math.round(attempt?.scorePercentage || 0);
  const allResponses = attempt?.responses || [];
  const correct = allResponses.filter(r => r.isCorrect).length;
  const wrong = allResponses.filter(r => r.isWrong).length;
  const skipped = allResponses.filter(r => r.isSkipped).length;
  const totalQ = questions?.length || 0;

  // Split questions by status
  const correctQs = (questions || []).filter(q => {
    const r = allResponses.find(r => r.questionId?.toString() === q._id?.toString());
    return r?.isCorrect;
  });
  const wrongQs = (questions || []).filter(q => {
    const r = allResponses.find(r => r.questionId?.toString() === q._id?.toString());
    return r?.isWrong;
  });
  const skippedQs = (questions || []).filter(q => {
    const r = allResponses.find(r => r.questionId?.toString() === q._id?.toString());
    return r?.isSkipped || !r;
  });

  const ringColor = scorePercent >= 60 ? '#10b981' : scorePercent >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Link to="/aspirant/pyq-papers" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <FiArrowLeft /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/aspirant/pyq-attempt-history" className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl hover:bg-dark-700 transition-all">
              <FiBarChart2 className="text-xs" /> History
            </Link>
            <Link to="/aspirant/pyq-comparison" className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl hover:bg-dark-700 transition-all">
              <FiTrendingUp className="text-xs" /> Compare
            </Link>
          </div>
        </div>

        {/* Score Banner */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 border border-slate-700 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <ProgressRing pct={scorePercent} size={120} stroke={10} color={ringColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{scorePercent}%</span>
              <span className="text-[10px] text-slate-500">Score</span>
            </div>
          </div>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-white">{paper?.title}</h1>
            <p className="text-slate-400 text-sm">{paper?.examId?.title} · {paper?.year} · {paper?.paperName}</p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                {attempt?.score?.toFixed(2)} / {paper?.totalMarks} marks
              </span>
              {attempt?.timeTakenMinutes && (
                <span className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-bold flex items-center gap-1">
                  <FiClock className="text-[10px]" /> {attempt.timeTakenMinutes} min
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Correct', value: correct, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20' },
            { label: 'Wrong', value: wrong, color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/20' },
            { label: 'Skipped', value: skipped, color: 'text-slate-400', bg: 'bg-slate-800/50 border-slate-700' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`border rounded-2xl p-4 text-center ${bg}`}>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Comparison with others */}
        {comparison && (
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FiTrendingUp className="text-indigo-400" /> How You Compare
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                ['Your Score', `${scorePercent}%`, 'text-amber-400'],
                ['Avg Score', `${Math.round(comparison.avgScore || 0)}%`, 'text-slate-300'],
                ['Top 10%', `${Math.round(comparison.top10Percent || 0)}%`, 'text-emerald-400'],
                ['Total Attempts', comparison.totalAttempts || 0, 'text-blue-400'],
              ].map(([label, val, color]) => (
                <div key={label} className="bg-dark-800 rounded-xl p-3 text-center">
                  <p className={`text-xl font-black ${color}`}>{val}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject-wise Breakdown */}
        {subjectWise.length > 0 && (
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FiBarChart2 className="text-amber-400" /> Subject-Wise Breakdown
            </h2>
            <div className="space-y-2">
              {subjectWise.map(sub => {
                const pct = sub.attempted > 0 ? Math.round((sub.correct / sub.attempted) * 100) : 0;
                return (
                  <div key={sub.subject} className="flex items-center gap-3">
                    <p className="text-xs text-slate-300 w-32 shrink-0 truncate">{sub.subject}</p>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full">
                      <div
                        className={`h-2 rounded-full transition-all ${pct >= 60 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs font-semibold text-white w-10 text-right">{pct}%</p>
                    <p className="text-[10px] text-slate-500 w-16 text-right">{sub.correct}/{sub.total}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Review */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Detailed Review</h2>
          <ResultSection title={`✓ Correct (${correctQs.length})`} questions={correctQs} responses={allResponses} correctAnswers={correctAnswers} />
          <ResultSection title={`✗ Wrong (${wrongQs.length})`} questions={wrongQs} responses={allResponses} correctAnswers={correctAnswers} />
          <ResultSection title={`— Skipped (${skippedQs.length})`} questions={skippedQs} responses={allResponses} correctAnswers={correctAnswers} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/aspirant/pyq-papers/${paper?._id}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-dark-800 border border-slate-700 text-slate-300 text-sm font-semibold rounded-xl hover:bg-dark-700 transition-all"
          >
            <FiAward /> Attempt Again
          </Link>
          <Link
            to="/aspirant/pyq-comparison"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20"
          >
            <FiTrendingUp /> View Progress Trends
          </Link>
        </div>
      </div>
    </div>
  );
}
