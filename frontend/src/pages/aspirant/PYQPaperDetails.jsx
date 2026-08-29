import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiAward, FiClock, FiBookOpen, FiAlertCircle, FiCheckCircle,
  FiArrowLeft, FiPlay, FiShield, FiGlobe, FiCalendar, FiLock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';

export default function PYQPaperDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    loadPaper();
  }, [id]);

  const loadPaper = async () => {
    setLoading(true);
    try {
      const { data } = await pyqAPI.getPYQPaper(id);
      setPaper(data);
    } catch (err) {
      toast.error('Failed to load paper details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!agreed) {
      toast.error('Please agree to the exam rules before starting.');
      return;
    }
    setStarting(true);
    try {
      const { data } = await pyqAPI.startAttempt(id);
      toast.success('Exam started! Good luck!');
      navigate(`/aspirant/pyq-papers/attempt/${data.attemptId}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start attempt.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4">
        <FiAward className="text-4xl text-slate-600" />
        <p className="text-slate-400">Paper not found.</p>
        <Link to="/aspirant/pyq-papers" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Back to PYQ Papers
        </Link>
      </div>
    );
  }

  const attemptsLeft = paper.attemptsLeft ?? 1;
  const canStart = attemptsLeft > 0;

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <Link
          to="/aspirant/pyq-papers"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <FiArrowLeft /> Back to PYQ Papers
        </Link>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 overflow-hidden shadow-2xl shadow-amber-600/20">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />
          <div className="flex items-start gap-4 relative">
            <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
              <FiAward className="text-3xl text-white" />
            </div>
            <div>
              <p className="text-amber-200 text-xs font-semibold uppercase tracking-wider">{paper.examId?.title}</p>
              <h1 className="text-2xl font-extrabold text-white mt-0.5 leading-tight">{paper.title}</h1>
              <p className="text-amber-100/70 text-sm mt-1">{paper.paperName} · {paper.year}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FiBookOpen, label: 'Questions', value: paper.questionIds?.length || 0 },
            { icon: FiClock, label: 'Duration', value: `${paper.durationMinutes} min` },
            { icon: FiCalendar, label: 'Year', value: paper.year },
            { icon: FiGlobe, label: 'Language', value: paper.language?.charAt(0).toUpperCase() + paper.language?.slice(1) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <Icon className="text-2xl text-amber-400 mx-auto mb-2" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Marking Scheme */}
        <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FiShield className="text-blue-400" /> Marking Scheme
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-800 rounded-xl p-3">
              <p className="text-xs text-slate-500">Correct Answer</p>
              <p className="text-lg font-black text-emerald-400">+{paper.totalMarks && paper.questionIds?.length ? (paper.totalMarks / paper.questionIds.length).toFixed(2) : '—'}</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-3">
              <p className="text-xs text-slate-500">Wrong Answer</p>
              <p className="text-lg font-black text-rose-400">
                {paper.negativeMarkingEnabled ? `–${paper.defaultNegativeMarks}` : 'No Penalty'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-800 rounded-xl p-3">
              <p className="text-xs text-slate-500">Total Marks</p>
              <p className="text-lg font-black text-white">{paper.totalMarks || '—'}</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-3">
              <p className="text-xs text-slate-500">Attempts Allowed</p>
              <p className="text-lg font-black text-amber-400">{paper.attemptLimit}</p>
            </div>
          </div>
        </div>

        {/* Source Verification */}
        {paper.sourceVerified && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <FiCheckCircle className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-400">Official & Verified Source</p>
              <p className="text-xs text-slate-500">
                Questions sourced from: <a href={paper.officialSourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-emerald-400 underline">{paper.officialSourceName}</a>
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {paper.instructions && (
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FiAlertCircle className="text-amber-400" /> Instructions
            </h2>
            <div className="prose prose-sm prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-xs text-slate-300 font-sans leading-relaxed">{paper.instructions}</pre>
            </div>
          </div>
        )}

        {/* Important Rules */}
        <div className="bg-dark-900/60 border border-amber-500/20 rounded-2xl p-5 space-y-2">
          <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <FiAlertCircle /> Important Rules
          </h2>
          <ul className="space-y-1.5">
            {[
              'Do not navigate away or the exam will auto-submit.',
              `You have ${paper.durationMinutes} minutes. Timer starts when you click Start.`,
              'Answers are auto-saved every 10 seconds.',
              'You can mark questions for review and revisit them.',
              paper.negativeMarkingEnabled
                ? `Negative marking applies: –${paper.defaultNegativeMarks} per wrong answer.`
                : 'No negative marking for this paper.',
              `You have ${paper.attemptLimit} attempt(s) total for this paper.`,
              'Do not use any external help. This is an integrity-based self-assessment.',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="text-amber-500 mt-0.5 shrink-0">•</span> {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Agreement */}
        <div className={`flex items-start gap-3 p-4 border rounded-2xl transition-all cursor-pointer ${agreed ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-dark-900/60 border-slate-800 hover:border-slate-600'}`}
          onClick={() => canStart && setAgreed(v => !v)}>
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${agreed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
            {agreed && <FiCheckCircle className="text-white text-xs" />}
          </div>
          <p className="text-sm text-slate-300">
            I have read all instructions and agree to the exam rules. I understand that leaving the tab or using any external help is a violation.
          </p>
        </div>

        {/* Attempt Status */}
        {!canStart && (
          <div className="flex items-center gap-2 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
            <FiLock className="text-rose-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-400">No More Attempts</p>
              <p className="text-xs text-slate-500">You have used all allowed attempts for this paper.</p>
            </div>
          </div>
        )}

        {paper.attemptsLeft !== undefined && (
          <p className="text-xs text-slate-500 text-center">
            {attemptsLeft} of {paper.attemptLimit} attempt{paper.attemptLimit !== 1 ? 's' : ''} remaining
          </p>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart || !agreed || starting}
          className="w-full py-4 text-lg font-black rounded-2xl transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed
            bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500
            text-white shadow-amber-600/25 flex items-center justify-center gap-3"
        >
          {starting ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Starting…</>
          ) : (
            <><FiPlay className="text-xl" /> Start PYQ Paper</>
          )}
        </button>
      </div>
    </div>
  );
}
