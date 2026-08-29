import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiBookOpen, FiClock, FiSearch, FiFilter, FiAward,
  FiChevronRight, FiPlay, FiTrendingUp, FiActivity, FiZap, FiBook
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

const EXAM_GRADIENTS = {
  'UPSC': 'from-amber-600 to-orange-600',
  'BPSC': 'from-blue-600 to-indigo-600',
  'JPSC': 'from-emerald-600 to-teal-600',
  'UPPSC': 'from-purple-600 to-violet-600',
  'SSC': 'from-rose-600 to-pink-600',
  'Banking': 'from-cyan-600 to-blue-600',
  'Railway': 'from-orange-600 to-amber-600',
  'Defence': 'from-slate-600 to-zinc-600',
};

function getExamColor(title) {
  const key = Object.keys(EXAM_GRADIENTS).find(k => title?.toUpperCase().includes(k));
  return EXAM_GRADIENTS[key] || 'from-brand-600 to-brand-500';
}

export default function CurrentAffairs() {
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterExam, setFilterExam] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLang, setFilterLang] = useState('');

  useEffect(() => {
    loadExams();
    loadPacks();
  }, []);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPacks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterExam) params.examId = filterExam;
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      if (filterCat) params.category = filterCat;
      if (filterLang) params.language = filterLang;

      const { data } = await currentAffairsAPI.getPacks(params);
      setPacks(data || []);
    } catch (err) {
      toast.error('Failed to load current affairs packs.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPractice = async (packId) => {
    try {
      const { data } = await currentAffairsAPI.startPractice(packId, {
        requestedQuestionCount: 20
      });
      toast.success(data.message || 'Practice session initialized!');
      navigate(`/aspirant/practice-session/${data.session._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start practice.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBookOpen className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">General Knowledge</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Current Affairs Portal</h1>
            <p className="text-slate-500 text-sm mt-0.5">Attempt monthly current affairs sets customized to your target exams.</p>
          </div>
          <Link
            to="/aspirant/current-affairs-history"
            className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            <FiActivity /> Practice History
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <RevisionSidebar active="Current Affairs" />

          {/* Main Area */}
          <div className="flex-1 space-y-5">

            {/* Filters panel */}
            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <select
                  value={filterExam}
                  onChange={e => setFilterExam(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Exams</option>
                  {exams.map(e => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Months</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Year"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                />
                <select
                  value={filterLang}
                  onChange={e => setFilterLang(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Languages</option>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="bilingual">Bilingual</option>
                </select>
                <button
                  onClick={loadPacks}
                  className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <FiFilter /> Filter
                </button>
              </div>
            </div>

            {/* Catalogue list */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : packs.length === 0 ? (
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                No monthly current affairs packs are available matching your query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {packs.map(p => {
                  const gradient = getExamColor(p.examIds?.[0]?.title);
                  const isSubmitted = p.attemptStatus === 'submitted';
                  const isInProgress = p.attemptStatus === 'started' || p.attemptStatus === 'created';

                  return (
                    <div
                      key={p._id}
                      className="group bg-dark-900/60 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-black/40"
                    >
                      <div className={`bg-gradient-to-r ${gradient} p-4 relative overflow-hidden`}>
                        <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/5" />
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-wider">
                          {new Date(0, p.month - 1).toLocaleString('en', { month: 'short' })} {p.year}
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-1 leading-snug line-clamp-2">{p.title}</h3>

                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {p.examIds?.map(ex => (
                            <span key={ex._id} className="text-[9px] bg-white/15 text-white px-2 py-0.5 rounded font-medium">
                              {ex.title}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1"><FiBookOpen className="text-[11px]" /> {p.totalQuestions || 0} Questions</span>
                          <span className="flex items-center gap-1"><FiClock className="text-[11px]" /> {p.estimatedPracticeMinutes || 30} min</span>
                        </div>

                        {/* Status bar */}
                        {p.attemptStatus && p.attemptStatus !== 'not_started' && (
                          <div className="flex items-center justify-between text-[10px] bg-dark-800 p-2 rounded-xl">
                            <span className="text-slate-500 font-medium">Your Attempt:</span>
                            {isSubmitted ? (
                              <span className="text-emerald-400 font-bold">Accuracy: {Math.round(p.accuracy)}%</span>
                            ) : (
                              <span className="text-amber-400 font-bold flex items-center gap-1"><FiZap className="animate-pulse" /> Resumable</span>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3">
                          <Link
                            to={`/aspirant/current-affairs/${p._id}`}
                            className="w-full text-center py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                          >
                            View details
                          </Link>
                          {isInProgress ? (
                            <Link
                              to={`/aspirant/practice-session/${p.activeSessionId}`}
                              className={`w-full py-2 text-center text-white text-xs font-bold rounded-xl bg-gradient-to-r ${gradient} shadow-md`}
                            >
                              Resume
                            </Link>
                          ) : isSubmitted ? (
                            <button
                              onClick={() => handleStartPractice(p._id)}
                              className="w-full py-2 text-white text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700"
                            >
                              Practice again
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartPractice(p._id)}
                              className={`w-full py-2 text-white text-xs font-bold rounded-xl bg-gradient-to-r ${gradient} shadow-md`}
                            >
                              Start practice
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
