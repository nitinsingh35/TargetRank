import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiBookOpen, FiClock, FiFileText, FiAward,
  FiCheckCircle, FiGlobe, FiShield, FiAlertCircle, FiPlay
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';

export default function CurrentAffairsPackDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [pack, setPack] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState('not_started');
  const [activeSessionId, setActiveSessionId] = useState(null);

  // Setup options
  const [questionCount, setQuestionCount] = useState(20);
  const [duration, setDuration] = useState(30);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const { data } = await currentAffairsAPI.getPackDetails(id);
      setPack(data.pack);
      setAttemptStatus(data.attemptStatus);
      setActiveSessionId(data.activeSessionId);
      setQuestionCount(Math.min(20, data.pack.totalQuestions || 10));
      setDuration(data.pack.estimatedPracticeMinutes || 30);
    } catch (err) {
      toast.error('Failed to load pack details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async () => {
    setStarting(true);
    try {
      const { data } = await currentAffairsAPI.startPractice(id, {
        requestedQuestionCount: questionCount,
        durationMinutes: duration
      });
      toast.success('Practice session started!');
      navigate(`/aspirant/practice-session/${data.session._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start practice.');
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

  if (!pack) {
    return (
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-3">
        <FiAward className="text-4xl text-slate-600" />
        <p className="text-slate-400">Pack not found.</p>
        <Link to="/aspirant/current-affairs" className="text-amber-400 hover:underline">
          ← Back to current affairs
        </Link>
      </div>
    );
  }

  const isResumable = activeSessionId && attemptStatus !== 'submitted';

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <Link
          to="/aspirant/current-affairs"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <FiArrowLeft /> Back to current affairs
        </Link>

        {/* Hero banner */}
        <div className="relative bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-6 overflow-hidden shadow-2xl shadow-amber-600/20">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 w-20 h-20 rounded-full bg-white/5" />
          <div>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase">
              {new Date(0, pack.month - 1).toLocaleString('en', { month: 'long' })} {pack.year}
            </span>
            <h1 className="text-2xl font-extrabold text-white mt-2 leading-tight">{pack.title}</h1>
            <p className="text-amber-100/70 text-xs mt-1.5 leading-relaxed">{pack.description}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            [FiBookOpen, 'Total Questions', pack.totalQuestions || 0],
            [FiClock, 'Duration Calc', `${pack.estimatedPracticeMinutes || 30} min`],
            [FiGlobe, 'Language', pack.language],
            [FiShield, 'Difficulty Mix', pack.difficultyMix]
          ].map(([Icon, label, val], idx) => (
            <div key={idx} className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <Icon className="text-2xl text-amber-400 mx-auto mb-1.5" />
              <p className="text-base font-bold text-white capitalize">{val}</p>
              <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Category Coverage List */}
        <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <FiBookOpen className="text-amber-400" /> Syllabus Coverage
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {pack.categories?.map(cat => (
              <span key={cat} className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs rounded-xl capitalize">
                {cat.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Linked Sources */}
        {pack.sources?.length > 0 && (
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <FiFileText className="text-blue-400" /> Linked News Sources & Reports
            </h3>
            <div className="space-y-2">
              {pack.sources.map(src => (
                <div key={src._id} className="p-3 bg-dark-850 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
                  <div>
                    <p className="font-semibold text-white">{src.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{src.publisherName} • {src.reliabilityLevel} reliability</p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                    Official Reference
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Setup Block */}
        <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <FiPlay className="text-emerald-400" /> Setup Practice Session
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Number of Questions</label>
              <select
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
              >
                <option value={10}>10 Questions</option>
                <option value={20}>20 Questions</option>
                <option value={30}>30 Questions</option>
                <option value={50}>50 Questions</option>
                <option value={pack.totalQuestions || 100}>All Available ({pack.totalQuestions || 0})</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Session Duration</label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
              >
                <option value={10}>10 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
          </div>

          {/* Warning check */}
          {questionCount > pack.totalQuestions && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-start gap-2">
              <FiAlertCircle className="shrink-0 mt-0.5" />
              <p>Only {pack.totalQuestions} verified questions are currently available in this pack. We will load all of them for you.</p>
            </div>
          )}

          {isResumable ? (
            <Link
              to={`/aspirant/practice-session/${activeSessionId}`}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2"
            >
              <FiPlay /> Resume Practice
            </Link>
          ) : (
            <button
              onClick={handleStartPractice}
              disabled={starting || pack.totalQuestions === 0}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-xl shadow-amber-600/25 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {starting ? 'Initializing…' : <><FiPlay /> Start Practice</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
